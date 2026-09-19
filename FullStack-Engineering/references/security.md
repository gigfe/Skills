# Seguridad

No es una sección opcional de "endurecer después" — lo que está acá vive en el scaffolding inicial por defecto (middlewares, `server.ts`, `hash.ts`), no es algo que haya que acordarse de pedir.

## Validación de inputs

Todo input llega sin confiar en el frontend — el frontend puede ser bypaseado con un curl directo a la API. Zod en el borde (middleware `validateBody`, ver `backend-express-postgres.md`) antes de que cualquier dato toque el service o la base de datos.

## Autenticación: contraseñas y JWT

- Contraseñas siempre con `bcrypt` (`utils/hash.ts`), nunca texto plano ni un hash reversible. Cost factor 12 documentado como constante, no mágico — subirlo no cuesta código, solo CPU en cada login.
- Access token JWT con expiración corta (`JWT_EXPIRES_IN=15m` por defecto) — un token de vida larga es una ventana de robo más larga si se filtra. Si el proyecto necesita sesiones más largas sin relogueo constante, agregar refresh token (endpoint separado, guardado hasheado en DB) recién cuando haga falta, no por adelantado.
- Almacenamiento del token en el cliente: `httpOnly cookie` es más seguro contra XSS (JS del navegador no puede leerla) y es la opción por defecto cuando frontend y backend comparten dominio o van detrás del mismo proxy (ver `deployment.md`). `localStorage` es más simple cuando frontend y backend están en dominios completamente separados sin proxy común, pero un XSS en la página puede robar el token — si se usa por esa necesidad, es un trade-off consciente, no el default sin pensarlo.

## Por qué no hay SQL injection en este stack

Prisma y Drizzle parametrizan todas las queries por diseño — nunca interpolás un valor de usuario directo en un string SQL. Si en algún momento hace falta una query cruda (`$queryRaw`/`sql` de Drizzle), siempre con placeholders parametrizados, nunca con template strings que concatenen `req.body` o `req.query` directo en el SQL.

## Headers, CORS y rate limiting

- `helmet()` en `server.ts` desde el día 1 — cabeceras de seguridad razonables por defecto sin configuración extra.
- CORS restringido a `ALLOWED_ORIGINS` (lista de dominios reales, separados por coma) — nunca `origin: '*'` ni `cors()` sin argumentos en un proyecto con datos reales, ni siquiera "temporalmente".
- Rate limiting (`express-rate-limit`, preset `authLimiter`) en login y registro — son los endpoints que un atacante puede abusar para fuerza bruta o credential stuffing. No hace falta rate limit global desde el inicio.

## Manejo de errores sin fuga de información

`error-handler.middleware.ts` ya implementa esto: un error no esperado (500) nunca devuelve `err.message` ni el stack al cliente en `NODE_ENV=production` — solo un mensaje genérico, el detalle real va a `console.error` (server-side). Los errores `AppError` (4xx) sí muestran su mensaje porque son mensajes de negocio ya pensados para mostrarse ("tarea no encontrada", no "constraint violation en la tabla tasks").

## Secretos y variables de entorno

`.env` nunca se commitea (confirmar que está en `.gitignore` del scaffolding). `.env.example`/`.env.production.example` documentan las claves sin valores reales. `JWT_SECRET` y `DATABASE_URL` (con credenciales) son secretos; nada con prefijo `VITE_*` lo es, porque Vite lo embebe en el bundle público en build time.

## Autorización — roles y permisos

**Los roles nunca se modelan como un enum ni como una lista fija en código.** Ni `enum Rol` de
Prisma, ni un `enum`/unión de literales de TypeScript, ni un `Record<Rol, Permiso[]>` con las
concesiones escritas a mano. Un rol es un dato operativo: crear "Agente junior" o quitarle un
permiso a "Supervisor" tiene que ser una operación de base de datos, no un cambio de código con
redeploy.

El modelo son tres piezas, y la división entre ellas es lo que hace que funcione:

| Pieza | Dónde vive | Por qué |
|-------|-----------|---------|
| **Catálogo de permisos** (`ticket:crear`, `sla:editar`) | Código, `core/permissions/catalogo.ts` | Son los códigos exactos que las rutas piden con `requirePermission`. En la base, un typo en un INSERT dejaría un endpoint inalcanzable para todos y nadie se enteraría hasta el 403. Además el compilador avisa si un permiso dejó de usarse. |
| **Roles** | Tabla `Rol` | Datos operativos, se crean y renombran sin tocar código. |
| **Concesiones** (qué rol tiene qué permiso) | Tabla `RolPermiso` | Es exactamente lo que se administra sin redeploy. |

Reglas que se siguen de eso:

- **El código pregunta por permiso, nunca por rol.** `requirePermission(PERMISOS.USUARIO_LEER)`,
  jamás `if (user.rol === 'Administrador')`. Un `if` por nombre de rol obliga a auditar cada
  archivo cuando se agrega un rol; preguntar por capacidad hace que un rol nuevo funcione solo.
- **El JWT lleva solo el id del usuario.** Ni rol ni permisos adentro: si viajaran en el token,
  cambiarle el rol a alguien o revocarle un permiso no tendría efecto hasta que el token expire.
- **Los permisos se resuelven por request, no en una cache de proceso.** La cache es tentadora
  (los permisos cambian una vez cada varios meses) pero rompe lo que motivó todo: un rol creado en
  caliente no existiría hasta reiniciar, y con varias instancias cada una tendría su copia
  desactualizada. El costo real es un `include` dentro de la consulta que `verifyToken` **ya**
  hace para comprobar que la cuenta siga activa — no una query extra.
- **El seed siembra, no impone.** Sincroniza el catálogo en cada corrida (crea permisos que
  falten, refresca descripciones) pero las concesiones se crean con `skipDuplicates` y sin ningún
  `delete`: si el administrador le quitó un permiso a un rol, re-correr el seed no se lo devuelve.
  A partir del primer arranque, la base manda.
- **El frontend decide qué mostrar por capacidad.** `puede(PERMISOS.X)` para pintar botones y
  pestañas, y los roles asignables de un formulario salen de `GET /api/roles`, no de un array
  literal en el componente. Eso es solo presentación: la autorización real la sigue aplicando el
  backend en cada endpoint.

Ver `assets/backend/permissions/` (catálogo, resolución y `role.middleware.ts`) y los modelos
`Permiso`/`RolPermiso` en `assets/prisma/schema.prisma.example`.

Esto es **complementario** a lo de abajo, no un reemplazo: el permiso responde "¿podés hacer esta
clase de cosa?" y el ownership responde "¿podés tocar *este* registro?". Un agente con
`ticket:cambiar-estado` sigue sin poder mover un ticket que no tiene asignado.

## Autorización — IDOR

Autenticar (¿quién sos?) no es lo mismo que autorizar (¿podés tocar *este* recurso puntual?). Un usuario logueado que pide `/api/tasks/123` no debería poder leer o modificar una tarea de otro usuario solo por adivinar el ID. `assertOwner(recurso.userId, req.user.id)` en `middlewares/auth.middleware.ts` es obligatorio en todo endpoint que devuelve o modifica un recurso de un usuario específico — ver el uso real en `assets/backend/example.service.prisma.ts`/`.drizzle.ts` (`getTaskById` llama a `assertOwner` antes de devolver la tarea).

## XSS en frontend

React escapa el contenido interpolado en JSX por defecto — el riesgo real está en `dangerouslySetInnerHTML` o en renderizar HTML/markdown que viene de una API externa o de otro usuario sin sanitizar antes. Si el proyecto necesita renderizar contenido enriquecido de terceros, sanitizar con una librería como `dompurify` antes de inyectarlo, nunca confiar en que "total, es solo texto".

## Dependencias

`npm audit` antes de un release es buena práctica — no lo conviertas en un paso obligatorio de CI desde el día 1 (mismo criterio de `dev-FS`: costo real se agrega cuando hay evidencia de que hace falta, no por defecto).

## Checklist de auditoría OWASP Top 10

Para auditar código ya escrito (propio o de otro), o como última pasada antes de dar un
scaffolding por terminado. Cada ítem es una pregunta concreta sobre el código, no teoría — y
apunta a qué patrón de este stack ya la resuelve cuando aplica.

1. **A01 — Broken Access Control**: ¿todo endpoint que devuelve/modifica un recurso de un
   usuario puntual llama `assertOwner`? ¿hay alguna ruta con `verifyToken` montado por error solo
   en algunos handlers del router y no en otros? ¿queda algún `if (user.rol === '...')` comparando
   contra un nombre de rol en vez de pedir un permiso? ¿el JWT lleva rol o permisos adentro (no
   debería: no se pueden revocar hasta que expire)? Ver roles/permisos e IDOR más arriba.
2. **A02 — Cryptographic Failures**: ¿las contraseñas pasan por `bcrypt` (nunca un hash reversible
   ni texto plano)? ¿`JWT_SECRET` tiene longitud real (32+ bytes random, no un string corto
   memorable)? ¿algo sensible viaja en la URL (query string) en vez de body/header?
3. **A03 — Injection**: ¿hay algún `$queryRaw`/`sql` crudo que concatene `req.body`/`req.query`
   directo en vez de usar placeholders parametrizados? (ver "Por qué no hay SQL injection" arriba
   — el riesgo real está solo en queries crudas).
4. **A04 — Insecure Design**: ¿un flujo de negocio permite un estado inválido porque no se validó
   la transición (ej. pasar un ticket de `cerrado` a `en_progreso` sin pasar por `reabierto`)?
   Esto no lo resuelve Zod (valida forma, no reglas de negocio) — se valida en el service.
5. **A05 — Security Misconfiguration**: ¿`cors()` está sin argumentos o con `origin: '*'`? ¿falta
   `helmet()`? ¿`NODE_ENV` no está seteado en producción (mensajes de error verbosos por
   default)? ¿queda algún endpoint de debug/test expuesto?
6. **A06 — Vulnerable and Outdated Components**: ¿`npm audit` tiene algo en `high`/`critical` sin
   revisar? ¿hay una dependencia sin mantenimiento hace años en el path crítico (auth, parsing)?
7. **A07 — Identification and Authentication Failures**: ¿el JWT tiene expiración corta
   (`JWT_EXPIRES_IN`)? ¿hay rate limit en login/registro? ¿se compara la contraseña con
   `comparePassword` (bcrypt) y no con `===`?
8. **A08 — Software and Data Integrity Failures**: ¿el frontend carga algún script de un CDN sin
   `integrity`/`crossorigin`? ¿una migración de Prisma/Drizzle se corre sin revisión en un pipeline
   automático hacia producción?
9. **A09 — Security Logging and Monitoring Failures**: ¿se loguean intentos de login fallidos
   (sin loguear la contraseña en sí)? ¿un error 500 real queda solo en la respuesta al cliente y
   nunca en `console.error`/logs del servidor? (ver "Manejo de errores" arriba — el detalle real
   siempre va server-side).
10. **A10 — Server-Side Request Forgery (SSRF)**: ¿algún endpoint acepta una URL de input del
    usuario y el servidor hace un `fetch`/request hacia ella (ej. "importar desde esta URL",
    webhook de prueba)? Si existe ese patrón, validar que la URL no apunte a IPs internas/
    `localhost`/metadata endpoints de la nube antes de resolverla.

## Seguridad de infraestructura/despliegue

Vive acá (no en `deployment.md`) porque es seguridad, no procedimiento — `deployment.md` referencia
esta sección en vez de duplicarla. Se aplica cuando el proyecto se prepara para producción, no
el día 1 de desarrollo local.

- **HTTPS/TLS obligatorio**: en producción, todo tráfico HTTP se redirige a HTTPS — sin
  excepción, ni siquiera "temporalmente" mientras se prueba. Si el hosting/proxy (Nginx, PaaS)
  ya termina TLS, el backend no necesita manejar certificados directamente, pero sí debe confiar
  solo en conexiones que llegaron por ese proxy (`trust proxy` en Express cuando corresponda,
  para que `req.secure`/rate limiting por IP funcionen bien detrás de un proxy).
- **Secretos en producción**: `.env` plano en el servidor es aceptable para un proyecto chico/
  solo, pero si el hosting ofrece un secret manager (variables de entorno del PaaS, Docker
  secrets, un vault) se prefiere eso a un archivo `.env` que alguien puede copiar por error. En
  ningún caso el `.env` de producción se commitea ni se manda por chat/email — se configura
  directo en el panel del hosting o server-side.
- **Hardening básico del servidor** (solo si es VPS propio, no aplica a PaaS gestionado): SSH
  con llave (no contraseña), firewall que solo abre los puertos necesarios (80/443, y 22
  restringido por IP si es posible), usuario sin privilegios de root para correr la app.
- **Rotación de secretos**: si un secreto (JWT_SECRET, credencial de DB) se filtró alguna vez
  (commit accidental, log expuesto), se rota — no alcanza con borrarlo del repo, ya está
  comprometido en el historial de git.
