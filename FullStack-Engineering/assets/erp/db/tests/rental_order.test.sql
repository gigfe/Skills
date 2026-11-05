-- pg_prove -d erp db/tests/*.sql  (o psql -f). Corre como erp_owner dentro de una transacción.
BEGIN;
SELECT plan(11);

-- Permisos: si esto falla, la frontera de seguridad se rompió.
SELECT ok(NOT has_table_privilege('erp_app', 'core.rental_order', 'SELECT'),
  'erp_app no lee tablas');
SELECT ok(NOT has_schema_privilege('erp_app', 'core', 'USAGE'),
  'erp_app no entra al esquema core');
SELECT ok(has_function_privilege('erp_app',
  'app.rental_order_create(uuid,uuid,uuid,date,date)', 'EXECUTE'),
  'erp_app ejecuta el SP');
SELECT ok(NOT has_function_privilege('public',
  'app.rental_order_create(uuid,uuid,uuid,date,date)', 'EXECUTE'),
  'PUBLIC no ejecuta el SP');

-- Error de negocio
SELECT throws_ok(
  $$SELECT * FROM app.rental_order_create(gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), '2026-02-10', '2026-02-01')$$,
  'BR001', NULL, 'rechaza fechas invertidas');

-- Camino feliz y efectos colaterales
SELECT lives_ok(
  $$SELECT * FROM app.rental_order_create('00000000-0000-0000-0000-000000000001',
    gen_random_uuid(), '00000000-0000-0000-0000-00000000000a', '2026-03-01', '2026-03-10')$$,
  'crea la orden');
SELECT is((SELECT count(*)::int FROM core.audit_log
  WHERE actor_id = '00000000-0000-0000-0000-000000000001'), 1, 'deja auditoría');
SELECT is((SELECT count(*)::int FROM core.outbox
  WHERE event_type = 'rental_order.created' AND published_at IS NULL), 1, 'deja evento en outbox');

-- Traslape
SELECT throws_ok(
  $$SELECT * FROM app.rental_order_create(gen_random_uuid(), gen_random_uuid(),
    '00000000-0000-0000-0000-00000000000a', '2026-03-05', '2026-03-15')$$,
  'BR002', NULL, 'rechaza traslapes');

-- Otro equipo en las mismas fechas sí es válido
SELECT lives_ok(
  $$SELECT * FROM app.rental_order_create(gen_random_uuid(), gen_random_uuid(),
    '00000000-0000-0000-0000-00000000000b', '2026-03-05', '2026-03-15')$$,
  'permite otro equipo en las mismas fechas');

-- Permisos de negocio: una cuenta sin rol no tiene ninguno
SELECT ok(NOT app.user_has_permission(gen_random_uuid(), 'rental-order:create'),
  'usuario inexistente no tiene permisos');

SELECT * FROM finish();
ROLLBACK;
