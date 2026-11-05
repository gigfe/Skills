# Perfil ERP — PostgreSQL y stored procedures

Templates ejecutables en `assets/erp/db/`.

## Esquemas y roles

| Esquema | Contiene | Quién accede |
|---------|----------|--------------|
| `core` | Tablas, outbox, auditoría | Solo el owner |
| `app` | Rutinas: la API de la base de datos | El rol de runtime ejecuta |

| Rol | Uso | Permisos |
|-----|-----|----------|
| `erp_owner` | Solo migraciones | Dueño de `core` y `app`, sin superuser |
| `erp_app` | La aplicación | `USAGE` en `app` y `EXECUTE` en sus rutinas; nada en `core` |

Si la app es vulnerada, el atacante solo puede ejecutar las operaciones de negocio, no un
`SELECT * FROM usuarios`. Ese es el valor central de este diseño.

**Detalles que suelen romperlo:**

- "Solo EXECUTE" en la práctica también exige `USAGE` sobre el esquema.
- PostgreSQL concede `EXECUTE` a `PUBLIC` por defecto en toda función nueva. Si no se revoca, cualquier
  rol puede ejecutarla. Revócalo con `ALTER DEFAULT PRIVILEGES` **sin** `IN SCHEMA`: un default por
  esquema solo añade permisos, no puede quitar el global. Lo hace `bootstrap-roles.sql`.
- Los defaults solo aplican a objetos creados por el rol indicado: las migraciones deben correr como
  `erp_owner`, nunca como superuser.
- Haz fallar el pipeline si algo se desvía: el test pgTAP verifica que `erp_app` no tenga privilegios
  sobre tablas.

## Funciones y procedimientos

En PostgreSQL, "SP" abarca dos cosas:

| | `FUNCTION` | `PROCEDURE` |
|---|---|---|
| Se invoca con | `SELECT * FROM app.fn(...)` | `CALL app.sp(...)` |
| Devuelve filas | Sí, `RETURNS TABLE` | No; solo parámetros `INOUT` |
| `COMMIT` interno | No | Sí, salvo con `SECURITY DEFINER` |

> **Decisión:** `FUNCTION` para casi todo. **Por qué:** devuelve filas y compone en una sola
> transacción. **Descartado:** `PROCEDURE` por defecto. **Cuándo sí convendría:** procesos masivos que
> hacen commit por lotes (cierre mensual, cargas), que no serán `SECURITY DEFINER` y requieren permisos
> propios.

## Convenciones de todo SP

```sql
CREATE FUNCTION app.rental_order_create(p_actor_id uuid, ...)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$ ... $$;
```

- **`SECURITY DEFINER` con `search_path` fijo, siempre.** Sin él, quien controle el `search_path`
  puede suplantar objetos y ejecutar código con privilegios del owner. Califica todo con su esquema
  (`core.tabla`). `pg_temp` va explícito al final para que no se busque primero.
- **Nombre** `app.<entidad>_<acción>`, parámetros `p_`, variables `v_`.
- **Primer parámetro `p_actor_id`** en escrituras y en lecturas con ownership: alimenta la auditoría y
  la verificación de acceso. Va como parámetro y no en una variable de sesión: es explícito y no
  depende de la conexión del pool.
- **SQL dinámico** solo con `format('%I', ...)` y `EXECUTE ... USING`; nunca concatenes valores.
- **Nada externo adentro:** sin HTTP ni extensiones de red. Inserta en `core.outbox`.
- **Listas:** paginación con límite máximo validado en el SP y total calculado aparte o con
  `count(*) OVER()`.
- **Sin lógica en triggers** salvo auditoría y `updated_at`: ocultan flujo y dificultan el debug.

## Errores de negocio

Usa SQLSTATE propios para que la app los mapee sin parsear textos:

```sql
RAISE EXCEPTION 'La fecha fin no puede ser anterior al inicio' USING ERRCODE = 'BR001';
```

Reserva un catálogo por proyecto (`BR001`, `BR002`...) documentado en un solo sitio y traducido en
`sp-error.mapper.ts`. Los códigos deben tener 5 caracteres, sin terminar en `000`, para no representar
una clase entera. Convierte en `BR` también lo esperado, como un `23P01` por traslape.

## Reglas en el esquema

Prefiere restricciones declarativas cuando alcancen: no se pueden saltar y resuelven la concurrencia
que un `IF EXISTS` en un SP no resuelve. Ejemplo: una `EXCLUDE USING gist` impide dos alquileres
solapados del mismo equipo; con `SELECT` previo, dos transacciones simultáneas pasarían ambas.

## Migraciones

> **Decisión:** SQL versionado con una herramienta simple (`dbmate`), salvo que el repo ya use otra.
> **Por qué:** el Perfil ERP vive de SQL escrito a mano. **Descartado:** Prisma Migrate. **Riesgo que
> evita:** Prisma Migrate compara contra `schema.prisma`; sin modelos declarados, `migrate dev` o
> `db push` pueden proponer borrar tablas reales. No los uses en este perfil.

- Toda migración corre como `erp_owner` y se revisa. `DOWN` solo si es realmente reversible.
- **Cambiar un SP:** `CREATE OR REPLACE` sirve si no cambian parámetros ni tipo de retorno. Si cambia
  el retorno, hace falta `DROP` + `CREATE`, y eso borra los `GRANT` explícitos (los defaults solo cubren lo que el owner crea en `app`; los tests de permisos lo confirman). Si cambian los tipos o
  la cantidad de parámetros, `CREATE OR REPLACE` crea una **sobrecarga** y deja viva la vieja: elimínala
  explícitamente.
- **Sin downtime, expand/contract:** agrega lo nuevo compatible, despliega la app, migra datos y luego
  elimina lo viejo. La versión anterior de la app debe seguir funcionando durante el deploy.
- Crea índices en tablas grandes con `CREATE INDEX CONCURRENTLY`, que no puede correr dentro de una
  transacción: márcalo en la herramienta.

## Llamar SPs desde NestJS

Prisma solo se usa en los adapters, y solo con SQL parametrizado:

```typescript
const rows = await this.db.$queryRaw<RentalOrderRow[]>`
  SELECT * FROM app.rental_order_create(
    ${actorId}::uuid, ${input.customerId}::uuid, ${input.startDate}::date, ${input.endDate}::date
  )`;
```

- Los casts explícitos evitan errores de resolución de tipos y sobrecargas.
- **Nunca** `$queryRawUnsafe` con datos de usuario.
- Tipa las filas a mano y cubre el contrato con un test de integración: el compilador no verifica la
  firma del SP.
- `$queryRaw` y el formato de su error dependen de la versión y del driver adapter de Prisma: confirma
  en el `package.json` real, y deja que el test de integración detecte cambios en `sp-error.mapper.ts`.
- Una llamada a un SP ya es una transacción. Si necesitas varias operaciones atómicas, crea un SP que
  las agrupe, no una transacción en la app.

> **Decisión:** Prisma solo como cliente de SPs (estándar de Ingsergel). **Por qué:** coherencia con el
> ERP y SQL parametrizado por tagged template. **Descartado:** `pg` directo. **Cuándo sí convendría:** en
> un proyecto nuevo, `pg` con un wrapper delgado da lo mismo con menos dependencias y sin paso de
> `generate`. Coméntaselo a Fernando si arranca algo desde cero; no migres lo existente.

## Modelado e índices

- PK `uuid` (`gen_random_uuid()`) o `bigint identity` para tablas muy grandes o internas.
- `numeric` para dinero, nunca `float`; `timestamptz` para instantes; `date` para fechas contables.
- FK siempre con índice si se consulta o borra por ella: PostgreSQL no lo crea solo.
- Cada índice se justifica con una consulta real y `EXPLAIN (ANALYZE, BUFFERS)`.
- Documentos y movimientos contables no se editan ni borran: se anulan con estado o contra-asiento.
- **Auditoría:** `core.audit_log` con actor, acción, entidad, antes, después y fecha, escrita por el SP.
  No guardes en ella contraseñas ni datos sensibles sin necesidad.

## Conexiones

`erp_app` con `statement_timeout` e `idle_in_transaction_session_timeout` limitados. Calcula el pool
(`instancias × tamaño`) contra `max_connections`. PgBouncer solo con evidencia.
