# Definition of Done

Checklist único de proyecto — se copia una sola vez en el scaffolding inicial, no se repite por historia. Cada historia en `docs/stories/` referencia este archivo en vez de duplicar el checklist.

- [ ] Código sigue la arquitectura del proyecto y sus convenciones (Perfil ERP: hexagonal con reglas en SPs; Perfil Express: `routes → controllers → services`).
- [ ] La funcionalidad respeta el proceso TO-BE y sus criterios de aceptación.
- [ ] Validación de inputs implementada con Zod, casos válidos e inválidos cubiertos.
- [ ] Lint y typecheck (`tsc --noEmit` + ESLint) pasan sin errores.
- [ ] Migraciones nuevas corridas localmente sin error. En Perfil ERP, cada SP nuevo tiene test pgTAP y permisos verificados.
- [ ] Manejo de errores: casos "no encontrado", de validación y de negocio cubiertos, respuesta de error en el formato estándar de la API; ningún error 500 expone stack/mensaje interno en producción.
- [ ] Endpoints que devuelven o modifican un recurso de usuario verifican ownership — sin excepción, para evitar IDOR.
- [ ] Endpoints sensibles (login, registro) tienen rate limiting aplicado.
- [ ] Endpoints nuevos probados manualmente (o con la colección Postman/Thunder Client si el proyecto ya usa una).
- [ ] Decisiones técnicas no triviales registradas en `.claude/memory/context.md` y bugs no triviales en `troubleshooting.md`, con confirmación previa.
- [ ] `README.md` actualizado si cambió la instalación, las variables de entorno, o los pasos de deploy.
- [ ] CI en verde (lint, typecheck, tests y build) antes de mergear a `main`, si el proyecto ya activó CI.
