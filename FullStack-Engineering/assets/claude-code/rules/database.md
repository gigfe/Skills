---
paths:
  - "db/**"
  - "backend/src/**/infrastructure/**"
---
# Base de datos

- Cambiar un SP es una migración nueva; nunca edites una ya aplicada.
- `CREATE OR REPLACE` con otros parámetros crea una sobrecarga: elimina la versión anterior.
- Si haces `DROP FUNCTION`, confirma que los permisos queden igual; el test pgTAP debe cubrirlo.
- Errores de negocio con SQLSTATE `BRnnn`, registrados en `sp-error.mapper.ts`.
- Dinero en `numeric`; instantes en `timestamptz`. FK consultadas con índice.
- Cambios de esquema compatibles hacia atrás (expand/contract).
