---
name: fullstack-engineering
description: Skill AUTOSUFICIENTE y de uso EXCLUSIVO para cualquier proyecto o módulo Node.js/Express + PostgreSQL + React/Vite (el stack que define la skill de planeación `dev-FS`) — cubre planeación técnica (backlog, historias de usuario, tareas) e implementación (scaffolding, seguridad de nivel senior con checklist OWASP, estructura de carpetas limpia, frontend responsive) de punta a punta, sin necesitar ningún flujo externo de planeación de tareas. ÚSALA SIEMPRE que el proyecto sea de este stack, incluso si el pedido suena a "planear", "armar un plan", "definir las tareas" o "diseñar la arquitectura" antes de escribir código — esta skill absorbe esa planeación, no la delega. Se activa al generar en disco el scaffolding real de un proyecto o módulo nuevo; al pedir conectar el backend a Postgres con Prisma o Drizzle, manejar migraciones o transacciones; al pedir un CRUD completo (routes→controllers→services contra Postgres) para una entidad; al pedir agregar autenticación JWT con hashing bcrypt; al pedir revisar, reforzar o auditar la seguridad de un backend Express (CORS, rate limiting, IDOR, headers, manejo de secretos, checklist OWASP Top 10); o al pedir que el frontend sea responsive/mobile-first. Dispara con frases naturales como "genera el scaffolding de este proyecto", "arma el backlog y el plan de un sistema de tickets con Node/TS/Express/React", "arma la estructura del backend con Prisma", "conéctame a Postgres con Drizzle", "dame el CRUD de tareas", "agrégale login con JWT", "revisa la seguridad del backend", "che, esto es seguro para producción?" o "hacelo responsive", sin necesidad de mencionar "skill", "scaffolding" ni el nombre del ORM explícitamente.
---

# fullstack-engineering

Brazo de implementación de `dev-FS`: esa skill decide *qué* construir y con qué stack (solo
planeación de producto, no toca disco); esta skill toma esas decisiones y genera tanto el plan
técnico como el código real. Si en la conversación no está resuelto el problema/roles/entidades/
flujos del proyecto (Fase 0 de `dev-FS`), invocá `dev-FS` primero — no dupliques esas preguntas
acá, y no saltes directo a generar carpetas sin que el "para qué" esté claro.

## Esta skill no delega en `superpowers`

Para proyectos de este stack, `FullStack-Engineering` (con `dev-FS` para la Fase 0 de producto)
reemplaza **por completo** a `superpowers:brainstorming`, `writing-plans`,
`subagent-driven-development` y `executing-plans` — no se invocan en ningún momento, ni siquiera
si el pedido está fraseado como "armá un plan" o "diseñá la arquitectura antes de picar código".

Motivo concreto: en un proyecto real (`Sistema-Tickets`) el flujo de `superpowers` generó su
propio plan en `docs/superpowers/plans/` sin consultar los estándares de esta skill, y el
resultado terminó con `cors()` sin restringir orígenes, sin `helmet()` y sin rate limiting en
login — exactamente lo que la sección de Seguridad de más abajo prohíbe. La planeación técnica
(qué se construye, en qué orden, con qué archivos) se resuelve enteramente con el flujo propio de
esta skill:

- **Planeación de producto** (problema, roles, entidades, flujos): Fase 0 de `dev-FS`.
- **Planeación técnica** (qué módulos, qué orden, qué queda para después): `backlog.md` +
  `docs/stories/US-XXX.md` de esta skill (ver "Scaffolding de un proyecto o módulo nuevo" más
  abajo) — nunca un plan aparte en `docs/superpowers/` ni ceder la ejecución a subagentes de
  `superpowers`.
- **Ejecución**: directo, generando el código en disco con los templates de `assets/`.

Si el usuario pide explícitamente `superpowers` para un proyecto de este stack, avisale en una
frase que esta skill ya cubre planeación + implementación y preguntale si igual quiere usar
`superpowers` — no lo bloquees, pero no lo ofrezcas ni lo actives por iniciativa propia.

## Stack fijo (no se repregunta)

Mismo stack que Fase 2/Fase 4 de `dev-FS` — no repitas el razonamiento del *por qué*, referenciá
esa skill si el usuario pregunta:

- **Backend**: Node.js + Express, TypeScript, arquitectura por capas `routes → controllers →
  services` — **sin capa `repository` separada por defecto** (el service habla directo con el
  cliente ORM; agregar repository solo si el proyecto ya lo justifica, ver
  `references/backend-express-postgres.md`).
- **Base de datos**: PostgreSQL, con Prisma o Drizzle como ORM (migraciones versionadas desde el
  día 1).
- **Frontend**: React + Vite + TypeScript + Tailwind CSS.
- **Validación**: Zod, siempre — no se pregunta ni se ofrece Joi.
- **Auth**: JWT manual (`jsonwebtoken` + `bcrypt`), migrable a Auth.js/Clerk después. El token
  lleva solo el id del usuario — ni rol ni permisos adentro.
- **Roles y permisos**: **nunca un enum ni una lista fija en código.** Los roles son filas de una
  tabla (`Rol`) y las concesiones también (`RolPermiso`); solo el *catálogo* de códigos de permiso
  vive en código, porque son los que las rutas piden. El código pregunta siempre por permiso
  (`requirePermission(PERMISOS.X)`), jamás por nombre de rol. Ver "Autorización — roles y
  permisos" en `references/security.md`.
- **Seguridad de base** (no opcional, vive en el scaffolding desde el día 1): `helmet`, CORS
  restringido por `ALLOWED_ORIGINS`, rate limiting en login/registro, manejo de errores sin fuga
  de stack trace en producción, verificación de ownership contra IDOR. Ver `references/security.md`.
- **Entorno**: 100% local en el día a día (Postgres nativo/contenedor, `npm run dev`). Docker,
  CI/CD y elección de hosting se posponen hasta que el usuario pida explícitamente preparar el
  proyecto para producción — no se generan en el scaffolding inicial.

Lo único que sí se pregunta cada vez: **Prisma vs Drizzle** — revisar primero
`.claude/memory/context.md` y si ya existe `prisma/schema.prisma` o `drizzle/schema.ts` en el
proyecto, antes de preguntar (ver `references/postgres-orm.md`).

## Cuándo usar cada referencia

No cargues todas si la tarea es puntual:

- Arquitectura de capas, manejo de errores, paginación, naming → `references/backend-express-postgres.md`
- Prisma vs Drizzle, setup, migraciones, transacciones → `references/postgres-orm.md`
- Estructura de componentes React, `DataTable`, formularios, convenciones Tailwind → `references/frontend-conventions.md`
- JWT/bcrypt, roles y permisos, CORS/helmet/rate limiting, IDOR, XSS, manejo de secretos, SQL injection → `references/security.md`
- Docker, CI/CD, elegir target de hosting (solo cuando se pida explícitamente) → `references/deployment.md`

Ejemplo: "conéctame a Postgres con Drizzle" solo necesita `postgres-orm.md`. "Arma el scaffolding
de este proyecto" necesita las tres primeras más la sección de abajo. "Revisá la seguridad del
backend" necesita `security.md` (y `backend-express-postgres.md` si hace falta tocar código).

## Scaffolding de un proyecto o módulo nuevo

Antes de generar nada en disco, preguntá en este orden:

1. **¿Proyecto nuevo o módulo dentro de un proyecto existente creado con esta skill?** Si es
   módulo en uno existente: pedí la ruta, leé su estructura real y replicala tal cual (mismas
   convenciones, mismo ORM, mismo esquema de auth) — no reinventes lo que ya existe, y no
   repreguntes lo que ya está resuelto ahí.
2. **Nombre del proyecto/módulo.** Con el nombre resuelto, agregá/actualizá la entrada en
   `backlog.md` y creá `docs/stories/US-XXX.md` desde `assets/agile/user-story-template.md`. Si
   el usuario ya dio una historia con criterios de aceptación explícitos, se transcribe tal cual.
3. **¿Requiere autenticación?** (sí/no).
4. **Prisma vs Drizzle** — revisar `context.md`/`package.json`/`prisma`-`drizzle` existente antes
   de preguntar.

Docker/CI/CD/hosting **no** se preguntan en este flujo — se disparan solo por intención explícita
("prepará esto para producción"), ver la sección de abajo.

**Fallback no interactivo** (si no hay forma de esperar respuesta): Prisma + auth sí (JWT) + sin
artefactos ágiles, todo anotado como `TODO: confirmar` — no lo des por definitivo.

Con eso resuelto, genera en disco:

```
/backend
  /src
    /routes
    /controllers
    /services
    /schemas        (Zod, un archivo por entidad — no confundir con las tablas del ORM)
    /middlewares
    /permissions     (catalogo.ts: códigos en código; index.ts: resolución contra la base)
    /utils
    /config          (env.ts: valida .env con Zod; db.ts: cliente Prisma o Drizzle)
    server.ts
  /prisma            (si se eligió Prisma: schema.prisma + migrations/)
  /drizzle           (si se eligió Drizzle: schema.ts + drizzle.config.ts + migrations/)
  .env.example
/frontend
  /src
    /components
    /pages
    /hooks
    /services        (cliente API)
    /types
    /schemas
    /context
  .env
/docs
  /stories
backlog.md
DEFINITION_OF_DONE.md
README.md            (instalación local: npm install en backend y frontend, copiar
                       .env.example a .env, correr migraciones de Prisma/Drizzle,
                       npm run dev en ambos; sección de deploy solo una vez decidido
                       el target, ver references/deployment.md)
```

En un **módulo dentro de un proyecto existente** (rama 1), `backlog.md`/`DEFINITION_OF_DONE.md`
no se regeneran — se reutiliza lo que el proyecto ya tiene, solo se agrega la entrada nueva.

## Preparar un proyecto para producción

Se dispara por intención ("prepará esto para producción", "quiero desplegarlo", "configurá el
CI"), no el día 1. Revisá primero `.claude/memory/context.md` por si el target ya quedó
registrado; si no, preguntá cuál aplica (VPS Linux+Nginx / PaaS gestionado / Windows Server sin
Docker) y seguí `references/deployment.md` para generar Dockerfiles, `docker-compose.yml` y
`.github/workflows/ci-cd.yml` (job de deploy comentado hasta confirmar target). La skill nunca
ejecuta `git push`, `gh` ni configura secrets remotos.

## Templates listos para copiar (`assets/`)

Copiarlos como punto de partida y adaptarlos (nombres de entidad, campos) — no dejarlos literal:

- `assets/backend/server.ts` — Express con `helmet`, CORS restringido y `errorHandler` montados desde el día 1.
- `assets/backend/config/env.ts` — valida `.env` con Zod al arrancar.
- `assets/backend/config/db.prisma.ts` / `db.drizzle.ts` — cliente singleton, copiar solo el elegido.
- `assets/backend/.env.example` — variables base (server, `DATABASE_URL`, JWT, CORS).
- `assets/backend/middlewares/error-handler.middleware.ts` — `AppError` + `asyncHandler`, sin fuga de stack en producción.
- `assets/backend/middlewares/auth.middleware.ts` — `verifyToken` (resuelve rol y permisos contra la base en cada request) + `assertOwner` (IDOR). Solo se copia si el proyecto requiere auth.
- `assets/backend/middlewares/role.middleware.ts` — `requirePermission`/`requireAnyPermission`, para montar en las rutas.
- `assets/backend/permissions/catalogo.ts` + `index.ts` — catálogo de permisos y su resolución. Se copian junto con los modelos `Rol`/`Permiso`/`RolPermiso` del schema de ejemplo.
- `assets/backend/middlewares/rate-limit.middleware.ts` — `authLimiter`, se monta en login/registro.
- `assets/backend/middlewares/validate.middleware.ts` — `validateBody(schema)` genérico para Zod.
- `assets/backend/utils/hash.ts` — `hashPassword`/`comparePassword` (bcrypt).
- `assets/backend/example.routes.ts`, `.controller.ts`, `.schema.ts` — independientes del ORM, vertical de una entidad (`task`) con paginación y auth.
- `assets/backend/example.service.prisma.ts` / `.drizzle.ts` — copiar solo el que corresponda al ORM elegido.
- `assets/prisma/schema.prisma.example` / `assets/drizzle/schema.ts.example` + `drizzle.config.ts.example` — modelo de la entidad de ejemplo.
- `assets/frontend/DataTable.tsx` — tabla paginada/filtrable, tipada genéricamente.
- `assets/frontend/LoginForm.tsx` — formulario base neutro; si el login es de cara al público, ajustarlo según "Diseño visual" más abajo antes de darlo por terminado.
- `assets/deployment/*` y `assets/agile/*` — ver secciones correspondientes arriba.

## Integración con project-memory

Mismo patrón que la skill hermana `Software Engineering`:

- Antes de preguntar algo que ya se resolvió en otra sesión (Prisma vs Drizzle, si el módulo
  requiere auth, target de despliegue), revisá `.claude/memory/context.md` primero si existe.
- Después de resolver una decisión no fija en este documento, preguntá si se registra en
  `context.md` — no lo registres sin confirmar.
- Un bug no trivial (ej. algo de conexión a Postgres, CORS entre frontend y backend, un token
  expirando antes de tiempo) se delega a `project-memory` (`troubleshooting.md`), no lo
  documentes vos mismo acá.

## Checklist final antes de dar el proyecto (o módulo) por terminado

Corré esto siempre al cerrar un scaffolding o un módulo — es el gate que habría atrapado los
problemas reales que motivaron esta revisión (CORS abierto, sin helmet, sin rate limit en login,
carpetas con nombre libre en vez de `backend/`/`frontend/`). No es una sugerencia, es el último
paso antes de decir "listo":

- [ ] `cors()` está restringido a `ALLOWED_ORIGINS` — nunca `cors()` sin argumentos ni `origin: '*'`.
- [ ] `helmet()` está montado en `server.ts`/`app.ts`.
- [ ] `authLimiter` (rate limit) está montado en `/login` y `/registro` (o equivalentes).
- [ ] Todo endpoint que devuelve/modifica un recurso de un usuario puntual llama `assertOwner` (IDOR).
- [ ] La autorización pide permisos, no roles: no queda ningún `if (user.rol === '...')` ni enum/lista fija de roles en el código, y el JWT no lleva rol ni permisos adentro.
- [ ] Los errores 500 no filtran `err.message`/stack cuando `NODE_ENV=production`.
- [ ] La raíz del proyecto usa `backend/` y `frontend/` (no nombres libres tipo `ProyectoBackend/`).
- [ ] Cada schema de input pasa por Zod (`validateBody`) antes del controller.
- [ ] Las pantallas nuevas se probaron mentalmente en mobile (`sm:`) y no solo en desktop — ver
      "Responsive (mobile-first)" en `references/frontend-conventions.md`.
- [ ] Si hubo pantallas con impacto de marca o cara al público, se aplicó el criterio de la
      sección "Diseño visual" de abajo — no se dejó en el nivel neutro por defecto sin pensarlo.

Si alguno falla, se corrige antes de considerar la tarea terminada — no se documenta como
`TODO` salvo que el usuario explícitamente pida diferirlo.

## Diseño visual — cuándo consultar `frontend-design`

El criterio depende de qué tipo de pantalla es, no es "siempre neutro" ni "siempre de marca":

- **Superficies internas** (dashboards/ERP, listados, formularios CRUD de uso interno, backoffice):
  paleta neutra (`slate`) igual que antes, pero subiendo el piso de calidad — jerarquía visual
  clara, espaciado consistente, estados `hover`/`focus`/`active` bien definidos en todo elemento
  interactivo. Prioriza consistencia y predictibilidad sobre identidad visual distintiva, pero
  "neutro" no es excusa para que se vea genérico o sin terminar.
- **Superficies con impacto de marca o cara al usuario final** (login/landing de un producto
  público, cualquier pantalla que un cliente externo vea primero): consultá la skill
  `frontend-design` (o `dataviz` si el caso es de visualización de datos) antes de generar el
  componente — no reinventes criterio de diseño visual acá.
- Si no es obvio por el contexto de la conversación cuál de las dos aplica, preguntalo una vez
  antes de generar la pantalla — no asumas "interna" por defecto solo porque es más simple.
