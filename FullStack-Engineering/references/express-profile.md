# Perfil Express

Node.js + Express + TypeScript · PostgreSQL con Prisma o Drizzle · React + Vite + Tailwind · Zod · JWT manual
(`jsonwebtoken` + `bcrypt`).

## Principios

- Capas `routes → controllers → services`, **sin `repository` por defecto**: el ORM ya es la capa de datos.
- El entorno es local en el día a día. Docker, CI/CD y hosting se agregan **solo** cuando se pide preparar para
  producción: cuestan configuración real y se justifican con evidencia.
- Lo único que se pregunta siempre es **Prisma vs Drizzle**, tras revisar `.claude/memory/context.md`,
  `package.json` y si existe `prisma/schema.prisma` o `drizzle/schema.ts`.

## Referencias

- Capas, errores, paginación, naming → `backend-express-postgres.md`
- ORM, migraciones, transacciones → `postgres-orm.md`
- React, `DataTable`, formularios, responsive → `frontend-conventions.md`
- Auth, permisos, CORS, IDOR, OWASP → `security.md`
- Docker, CI/CD, hosting (solo a pedido) → `deployment.md`

## Scaffolding

```
/backend
  /src
    /routes  /controllers  /services
    /schemas        (Zod, un archivo por entidad; no son las tablas del ORM)
    /middlewares
    /permissions    (catalogo.ts: códigos; index.ts: resolución contra la base)
    /utils
    /config         (env.ts valida .env con Zod; db.ts: cliente Prisma o Drizzle)
    server.ts
  /prisma           (si es Prisma: schema.prisma + migrations/)
  /drizzle          (si es Drizzle: schema.ts + drizzle.config.ts + migrations/)
  .env.example
/frontend
  /src
    /components  /pages  /hooks  /services  /types  /schemas  /context
  .env
/docs/stories
backlog.md
DEFINITION_OF_DONE.md
README.md           (instalación local; deploy solo con target decidido)
```

Si no hay forma de esperar respuesta: Prisma, auth con JWT, sin artefactos ágiles, todo como `TODO: confirmar`.

## Templates (`assets/`)

Copia y adapta; no los dejes literales.

- `backend/server.ts`: Express con helmet, CORS restringido y `errorHandler`.
- `backend/config/env.ts`, `db.prisma.ts` / `db.drizzle.ts` (solo el elegido), `backend/.env.example`.
- `backend/middlewares/`: `error-handler` (`AppError`, `asyncHandler`), `auth` (`verifyToken`, `assertOwner`; solo
  con auth), `role` (`requirePermission`), `rate-limit` (`authLimiter`), `validate` (`validateBody`).
- `backend/permissions/catalogo.ts` + `index.ts`, junto con `Rol`/`Permiso`/`RolPermiso` del schema de ejemplo.
- `backend/utils/hash.ts`: bcrypt.
- `backend/example.routes.ts`, `.controller.ts`, `.schema.ts`, `.service.prisma.ts` / `.service.drizzle.ts`.
- `prisma/schema.prisma.example`, `drizzle/schema.ts.example`, `drizzle/drizzle.config.ts.example`.
- `frontend/DataTable.tsx`, `frontend/LoginForm.tsx` (formulario neutro; ajústalo si es de cara al público).
- `deployment/*`: solo a pedido. `agile/*`: backlog, historias y Definition of Done.

## Preparar para producción

Se dispara por intención ("prepara esto para producción", "quiero desplegarlo", "configura el CI"). Revisa
`context.md` por si el target ya está decidido; si no, pregunta (VPS Linux + Nginx, PaaS o Windows Server sin
Docker) y sigue `deployment.md`. Aplica además el hardening y los backups de `infra-vps.md` si es VPS.

## Checklist

- [ ] `cors()` restringido a `ALLOWED_ORIGINS`, nunca sin argumentos ni `origin: '*'`.
- [ ] `helmet()` montado en `server.ts`.
- [ ] `authLimiter` montado en login y registro.
- [ ] Todo endpoint sobre un recurso de un usuario puntual llama a `assertOwner`.
- [ ] Autorización por permisos; JWT solo con id.
- [ ] Errores 500 sin `err.message` ni stack con `NODE_ENV=production`.
- [ ] Raíz con `backend/` y `frontend/`.
- [ ] Todo input pasa por `validateBody` antes del controller.
- [ ] Pantallas revisadas en mobile (ver "Responsive" en `frontend-conventions.md`).
