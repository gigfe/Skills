# Backend — Convenciones Express + TypeScript + Postgres

## Arquitectura por capas (sin repository por defecto)

```
routes → controllers → services
```

- **routes**: solo define endpoints, qué middlewares corren (auth, rate limit, validación) y qué controller atiende cada uno. Cero lógica.
- **controllers**: recibe `req`/`res`, llama al service, formatea la respuesta. Nunca importa Prisma/Drizzle directamente.
- **services**: lógica de negocio Y acceso a datos — habla directo con `prisma` o `db` (Drizzle). No toca `req`/`res`.

**Criterio senior, no atajo**: a diferencia del stack SQL Server (que sí separa `repository`), acá el ORM ya es la capa de acceso a datos — envolverlo en un `repository` que solo reenvía llamadas a Prisma/Drizzle es una capa que no gana nada por ahora. Si el proyecto crece al punto de necesitar aislar el ORM (tests con mocks pesados, swap de motor de datos), agregar `repository` en ese momento — no antes. Mismo principio de costo cero vs costo real que usa `dev-FS` para el stack, aplicado ahora al código.

Un archivo por entidad y capa: `task.routes.ts`, `task.controller.ts`, `task.service.ts`, `task.schema.ts`. Todas las rutas se montan en un router central (`/backend/src/routes/index.ts`).

`/backend/src/config/env.ts` valida las variables de entorno con Zod al arrancar (falla rápido si falta algo, ver `assets/backend/config/env.ts`) y `/backend/src/config/db.ts` (Prisma o Drizzle, ver `postgres-orm.md`) se importa una sola vez desde cada service que lo necesite — no se re-crea el cliente en cada archivo.

## Naming

- Carpetas: `kebab-case`.
- Archivos: `<entidad>.<capa>.ts` (ej. `task.service.ts`).
- Variables/funciones: `camelCase`. Clases/tipos/interfaces: `PascalCase`.
- Rutas REST en plural: `/api/tasks`, `/api/tasks/:id`.

## Manejo de errores centralizado

Usa siempre `assets/backend/middlewares/error-handler.middleware.ts` como base:

- Clase `AppError extends Error` con `statusCode`, lanzada desde el service cuando algo es un error de negocio esperado (ej. "tarea no encontrada" → 404, "sin permiso" → 403).
- Montado **al final** de `app.use(...)` en `server.ts`, después de todas las rutas.
- Respuesta consistente en toda la API: `{ "error": { "message": "..." } }`.
- Los errores no esperados (500) **nunca** exponen `err.message`/stack en `NODE_ENV=production` — ver el detalle completo en `security.md`.
- Los controllers envuelven su lógica async en `asyncHandler`, para no repetir `try/catch` en cada endpoint (ver el archivo, es el mismo patrón en todo el proyecto).

## Validación de inputs

Zod está fijo en este stack (no se pregunta, a diferencia de Zod/Joi del stack SQL Server). Un schema por entidad en `/backend/src/schemas/<entidad>.schema.ts`, reutilizado por el middleware genérico `validateBody` (`assets/backend/middlewares/validate.middleware.ts`) montado en la ruta, antes del controller — nunca dentro de service.

```typescript
router.post('/', validateBody(createTaskSchema), taskController.createTask);
```

## Autenticación (solo si el módulo la requiere)

- JWT: middleware `verifyToken` en `middlewares/auth.middleware.ts`, valida `Authorization: Bearer <token>` y adjunta el usuario decodificado a `req.user`. Se aplica por router (`router.use(verifyToken)`), no globalmente — hay endpoints públicos (login, registro) que no lo llevan.
- Contraseñas: `hashPassword`/`comparePassword` de `utils/hash.ts` (bcrypt). Nunca comparar contraseñas en texto plano ni loguearlas.
- Autorización más allá de "está logueado": ver `assertOwner` contra IDOR en `security.md` — es obligatorio en cualquier endpoint que devuelva o modifique un recurso de un usuario puntual.

## Paginación

Convención de query params consistente en todos los listados:

```
GET /api/tasks?page=1&pageSize=20
```

El controller parsea con defaults (`page=1`, `pageSize=20`) y pasa los valores al service. Prisma usa `skip`/`take`; Drizzle usa `.limit()`/`.offset()` — ver el patrón completo en `postgres-orm.md`. Si un listado crece a decenas de miles de filas, considerar keyset pagination (cursor por `id`/`createdAt`) en vez de `OFFSET` — diferido hasta que haya evidencia real de que hace falta.

## CORS, headers y rate limiting

`assets/backend/server.ts` ya trae `helmet()` y CORS restringido a `ALLOWED_ORIGINS` desde el día 1 — **no** es una sección aparte de "producción", es parte del código base (ver por qué en `security.md`). El rate limiting de endpoints sensibles (`authLimiter` en `middlewares/rate-limit.middleware.ts`) se monta solo en las rutas de login/registro, no globalmente.

## Healthcheck

Endpoint público, sin auth, útil para el `HEALTHCHECK` de Docker cuando se prepare el proyecto para producción:

```typescript
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
```

No toca la base de datos — un healthcheck que depende de la DB puede reportar el proceso como caído por un problema de red transitorio de la DB, no del propio servidor.

## Logging estructurado (diferido)

`console.log`/`console.error` alcanza mientras el proyecto es chico. Si el volumen de logs o la necesidad de buscarlos en un target real lo justifica, migrar a `pino` (JSON en producción, pretty-print en dev) — no agregarlo por adelantado sin esa señal, mismo criterio de `dev-FS` para Docker/CI.
