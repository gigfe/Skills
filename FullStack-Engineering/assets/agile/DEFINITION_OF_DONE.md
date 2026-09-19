# Definition of Done

Checklist único de proyecto — se copia una sola vez en el scaffolding inicial, no se repite por historia. Cada historia en `docs/stories/` referencia este archivo en vez de duplicar el checklist.

- [ ] Código sigue la arquitectura por capas `routes → controllers → services` (sin capa `repository` salvo que el proyecto ya la haya adoptado explícitamente) y las convenciones de naming (`references/backend-express-postgres.md`).
- [ ] Validación de inputs implementada con Zod, casos válidos e inválidos cubiertos.
- [ ] Lint y typecheck (`tsc --noEmit` + ESLint) pasan sin errores.
- [ ] Migraciones nuevas (`prisma migrate dev` o `drizzle-kit generate`) generadas y corridas localmente sin error.
- [ ] Manejo de errores: casos "no encontrado" y de validación cubiertos con `AppError`, respuesta de error en el formato estándar de la API; ningún error 500 expone stack/mensaje interno en producción.
- [ ] Endpoints que devuelven o modifican un recurso de usuario verifican ownership (`assertOwner`) — sin excepción, para evitar IDOR.
- [ ] Endpoints sensibles (login, registro) tienen rate limiting aplicado.
- [ ] Endpoints nuevos probados manualmente (o con la colección Postman/Thunder Client si el proyecto ya usa una).
- [ ] Decisiones técnicas no triviales registradas en `context.md` y bugs no triviales en `troubleshooting.md` (vía `project-memory`, con confirmación previa).
- [ ] `README.md` actualizado si cambió la instalación, las variables de entorno, o los pasos de deploy.
- [ ] CI en verde (`ci-cd.yml`: lint + typecheck + build, y test si el proyecto ya tiene test runner) antes de mergear a `main` — solo aplica si el proyecto ya activó CI (ver "Preparar para producción" en SKILL.md).
