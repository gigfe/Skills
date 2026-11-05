# Perfil ERP — Arquitectura

NestJS + Fastify · PostgreSQL 16 con lógica en SPs · Vue 3 + PrimeVue + Tailwind · Redis · BullMQ ·
almacenamiento S3 · VPS Contabo · n8n · arquitectura hexagonal.

## La idea

La base de datos protege las reglas y datos; NestJS expone, autentica y orquesta lo externo; Vue
presenta. Hexagonal aquí significa que el negocio no conoce a sus adaptadores: un caso de uso depende
de un puerto, no de Prisma.

**Cuidado con la sobre-ingeniería.** Con la lógica en SPs, el hexágono queda delgado, y eso es
correcto. No dupliques reglas en `domain/` por llenar la carpeta: dos versiones de una regla terminan
divergiendo. Si un caso de uso solo llama un SP, el controller puede invocarlo con un use case de tres
líneas; lo que no se justifica son factories, mappers y clases abstractas sin segunda implementación.

## Qué va en cada lugar

| Va en el SP | Va en NestJS | Va en n8n |
|-------------|--------------|-----------|
| Reglas e invariantes, transiciones de estado, cálculos, ownership, auditoría, escritura del outbox | Autenticación, permisos por endpoint, validación de forma (Zod), orquestación, colas, archivos, llamadas externas | Integraciones entre sistemas sin regla de negocio crítica: notificaciones, WhatsApp, sincronizaciones |

Criterio rápido: si la regla debe cumplirse sin importar quién llame, va en el SP. Si necesita red,
disco o tiempo, va fuera de la transacción.

> **Decisión:** lógica en SPs. **Por qué:** una sola fuente de verdad, permisos mínimos y transacciones
> junto a los datos. **Descartado:** lógica en services con ORM. **Cuándo sí convendría:** reglas que
> dependen de servicios externos, equipos sin experiencia en PL/pgSQL o proyectos chicos (Perfil
> Express).

## Estructura

```
backend/src/
  main.ts                          # assets/erp/backend/main.ts
  app.module.ts
  config/env.ts                    # valida el entorno con Zod al arrancar
  shared/
    db/prisma.service.ts           # único punto con Prisma
    db/sp-error.mapper.ts          # SQLSTATE → error de negocio
    domain.error.ts                # error de negocio sin framework
    http/zod-validation.pipe.ts
    http/domain-exception.filter.ts
    auth/                          # JwtGuard, PermissionsGuard, @RequirePermission
    outbox/outbox.poller.ts        # BullMQ
  modules/rentals/
    domain/                        # solo si hay lógica pura; cero imports de framework
    application/
      ports/rental-orders.port.ts  # interfaz
      create-rental-order.use-case.ts
    infrastructure/rental-orders.sp-adapter.ts  # único archivo con SQL
    http/rentals.controller.ts
    http/rentals.schemas.ts        # Zod
    rentals.module.ts
    jobs/                          # procesadores BullMQ del módulo
db/
  migrations/                      # SQL versionado (tablas y rutinas)
  bootstrap-roles.sql
  tests/*.sql                      # pgTAP
frontend/src/                      # ver erp-frontend.md
docs/stories/  docs/adr/
backlog.md  DEFINITION_OF_DONE.md  CLAUDE.md  README.md  docker-compose.yml
```

Regla de dependencia: `http` e `infrastructure` → `application` → `domain`. Nunca al revés.

Excepción pragmática: los decoradores de NestJS (`@Injectable`, `@Inject`) se concentran en `http`,
`infrastructure` y el `*.module.ts`; registra el use case con `useFactory`. Es poco código y mantiene
limpio `application/`.

## Templates (`assets/erp/`)

| Archivo | Uso |
|---------|-----|
| `backend/main.ts`, `app.module.ts` | Fastify con helmet, CORS restringido, trust proxy, throttler y filtro de errores |
| `backend/config/env.ts` | Validación del entorno |
| `backend/shared/prisma.service.ts`, `sp-error.mapper.ts`, `domain.error.ts` | Acceso a SPs y mapeo de errores |
| `backend/shared/zod-validation.pipe.ts`, `domain-exception.filter.ts` | Validación y errores HTTP |
| `backend/shared/jwt.guard.ts`, `permissions.guard.ts` | Sesión con solo el id; permisos resueltos por request |
| `backend/shared/outbox.poller.ts` | Publica el outbox en BullMQ |
| `backend/modules/rentals/*` | Vertical hexagonal completa de ejemplo |
| `db/*` | Roles, migraciones (permisos, SP, outbox), test pgTAP, imagen pgTAP |
| `frontend/*` | Página PrimeVue, cliente API y permisos |
| `docker-compose.dev.yml` | Postgres, Redis y almacenamiento S3 local |
| `infra/*`, `ci.yml` | Producción, backups y CI |

## Decisiones técnicas

**Validación con Zod, no `class-validator`.** Usa `ZodValidationPipe`: los esquemas se comparten con
el frontend, y Zod ya es el estándar del Perfil Express. Solo valida forma; las reglas viven en el SP.

**Fastify en NestJS.** `@nestjs/platform-fastify` usa plugins propios: `@fastify/helmet`,
`@fastify/cors`, `@fastify/cookie`. Los middlewares de Express (`helmet`, `cors`) no aplican. Rate
limit con `@nestjs/throttler`, respaldado en Redis si hay más de una instancia.

**Permisos.** Mismo modelo de `security.md` (catálogo en código, roles y concesiones en BD), pero
resueltos mediante un SP: `PermissionsGuard` llama a `app.user_has_permission` en cada request, y el frontend carga su lista con `app.user_permissions`. El
ownership se verifica dentro del SP con `p_actor_id`, de modo que no se pueda saltar desde un endpoint
nuevo.

**Efectos externos: patrón outbox.** Una llamada HTTP dentro de una transacción puede dejar el correo
enviado y la venta revertida. El SP inserta el evento en `core.outbox` en la misma transacción; un
poller lo publica en BullMQ y el worker hace el efecto. La entrega es *at-least-once*: los procesadores
deben ser idempotentes (usa `jobId` = id del evento).

**BullMQ y Redis.** Redis debe correr con `maxmemory-policy noeviction`, porque si expulsa claves se
pierden jobs. Define `attempts`, backoff y qué pasa con los jobs fallidos.

**Archivos.** La BD guarda metadatos; el archivo va en almacenamiento S3 con presigned URLs tras
verificar permisos. Accede siempre por un puerto y el API S3, para poder cambiar de proveedor. Ver el
aviso sobre MinIO en `infra-vps.md`.

**Webhooks y n8n.** n8n consume endpoints propios con API key o firma, nunca credenciales de BD ni una
conexión directa a las tablas. Valida la firma de lo que entre, y procésalo por cola.

**Errores.** Respuesta uniforme `{ "error": { "code", "message" } }`. Los errores de negocio muestran
su mensaje; los inesperados, uno genérico, con el detalle solo en logs.

## Construir un módulo de punta a punta

1. Historia con criterios de aceptación, validada contra el TO-BE.
2. Migración: tablas, índices y SPs, más tests pgTAP (ver `erp-database.md`).
3. Puerto, adapter y test de integración con Testcontainers.
4. Use case, controller, esquemas Zod, permisos.
5. Frontend: servicio API, página, estados de carga, vacío y error.
6. Jobs y efectos externos, si aplican.
7. Revisión de seguridad y calidad; checklist final de `SKILL.md`.
