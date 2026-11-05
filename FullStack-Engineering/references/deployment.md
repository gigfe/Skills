# Perfil Express — Deployment (diferido)

Para el Perfil ERP, usa `infra-vps.md`.

Nada de esto es parte del scaffolding inicial de un proyecto nuevo — se genera solo cuando el usuario pide explícitamente preparar el proyecto para producción (ver "Preparar para producción" en `express-profile.md`). La razón: Docker/CI/hosting cuestan configuración real, se posponen hasta que hay evidencia de necesidad, a diferencia de TypeScript/Zod/capas/migraciones que se hacen siempre porque no cuestan nada extra.

Este archivo cubre el *procedimiento* de deploy. Los requisitos de seguridad del entorno de producción (HTTPS/TLS obligatorio, gestión de secretos, hardening de servidor, rotación de secretos filtrados) viven en la sección "Seguridad de infraestructura/despliegue" de `security.md` — revisarla siempre junto con este checklist, no solo el día del deploy.

## Checklist al pasar a producción

1. `.env` de producción (`assets/deployment/.env.production.example` como plantilla, sin secretos reales).
2. Elegir hosting — si el tráfico es nacional/regional, priorizar datacenter cerca de esa región.
3. Correr las migraciones ya versionadas (`prisma migrate deploy` o `drizzle-kit migrate`) contra la base real.
4. Docker opcional, solo si el hosting lo requiere o lo simplifica.

Ningún paso de este checklist toca la arquitectura del proyecto — es configuración externa sobre código que ya estaba listo desde el scaffolding.

## Docker

`assets/deployment/Dockerfile.backend` (multi-stage: build con `tsc`, runtime `node:20-alpine` no-root, healthcheck en `/health`), `Dockerfile.frontend` (build Vite, runtime `nginx:alpine` sirviendo `/dist` con fallback SPA y proxy `/api`, `nginx.conf`).

`docker-compose.yml` incluye `backend` + `frontend` + `postgres` (Postgres en contenedor Linux es un target de producción razonable, no solo de dev; si el hosting ofrece Postgres gestionado, comentar el servicio `postgres` y apuntar `DATABASE_URL` al endpoint gestionado).

## Targets

- **VPS Linux + Nginx**: `docker-compose.yml` + reverse proxy + Certbot para TLS.
- **PaaS gestionado** (Render/Railway/Fly.io): mismas Dockerfiles, Postgres gestionado por el PaaS o por un proveedor aparte (Neon, Supabase).
- **Windows Server sin Docker**: backend con PM2/NSSM, frontend servido por IIS — las Dockerfiles quedan sin usar en este target, mencionarlo explícitamente para no generar confusión.

Preguntar cuál aplica, revisando primero `.claude/memory/context.md` por si ya quedó decidido en otra sesión (mismo criterio que Prisma/Drizzle).

## CI/CD

`assets/deployment/ci-cd.yml` se copia a `.github/workflows/ci-cd.yml` solo en este momento, no en el scaffolding inicial. Build+lint+typecheck+test corren siempre en push/PR a `main`; el job de `deploy` queda comentado hasta que el target esté decidido — la skill genera el YAML, nunca ejecuta `git push`, `gh` ni configura secrets remotos, eso es manual del usuario en GitHub → Settings → Secrets.

## Variables de entorno por ambiente

Misma mecánica `dotenv/config` que en dev, el archivo que se carga lo decide cómo se invoca el proceso en cada ambiente. `DATABASE_URL` de producción normalmente exige SSL (`?sslmode=require` en la connection string) si la base es gestionada — verificar la documentación del proveedor elegido.
