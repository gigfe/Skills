# Estrategia de tests

## Testing Trophy

Prioriza los tests que dan más confianza por su costo. Con la lógica en SPs, un mock de la base de
datos no prueba casi nada: por eso el grueso va en integración real.

| Capa | Herramienta | Qué cubre | Peso |
|------|-------------|-----------|------|
| Estática | TypeScript, ESLint | Tipos, errores obvios | Siempre |
| SPs | pgTAP | Reglas, transiciones, errores `BR`, permisos | Alto |
| Integración | Testcontainers + Jest/Vitest | Adapter ↔ SP real, HTTP ↔ base real | **El mayor** |
| Unitarios | Jest/Vitest | Lógica pura en `domain/` o frontend | Bajo |
| E2E | Playwright | 3-5 flujos críticos del TO-BE | Pocos |

Qué no testear: getters, código del framework, mocks de Prisma que replican la implementación.

## pgTAP

Cada SP nuevo prueba: camino feliz, cada error de negocio, ownership y efectos colaterales (auditoría,
outbox). Además, un test de permisos que falle si `erp_app` obtiene acceso a tablas. Ver
`assets/erp/db/tests/rental_order.test.sql`.

Corre dentro de `BEGIN ... ROLLBACK`, así que no deja datos. La imagen oficial de Postgres no trae
pgTAP: usa `assets/erp/db/Dockerfile.pgtap`.

## Integración con Testcontainers

- Levanta PostgreSQL real con la misma versión mayor que producción, aplica `bootstrap-roles.sql` y las
  migraciones, y conecta como `erp_app`. Si conectas como superuser, un permiso faltante no se detecta.
- Reutiliza el contenedor por suite; aísla datos con identificadores únicos por test.
- Prueba mapeo de errores (`BR001` → 422) y contrato de filas del adapter.
- Levanta Redis real si el test abarca colas. Testcontainers requiere Docker en CI.

## E2E

Solo los flujos que, si fallan, detienen el negocio: login, crear pedido, facturar. Muchos E2E son
lentos y frágiles; ahí es donde una suite termina ignorada.

## Calidad en CI

Orden, del más barato al más caro: lint y typecheck → pgTAP → integración → build → E2E. Ver
`assets/erp/ci.yml`.

- Una migración se prueba desde cero, y si hay datos sensibles a volumen, contra una copia anonimizada.
- Un bug corregido deja su test.
- Evita perseguir un porcentaje de cobertura: mide si los criterios de aceptación y los SPs críticos
  están cubiertos.
