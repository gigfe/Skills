-- migrate:up
-- Ejemplo de la vertical "rentals". Corre como erp_owner. Adáptala; no la dejes literal.

CREATE TABLE core.rental_order (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL,
  equipment_id uuid NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  -- La base impide los traslapes aun con transacciones simultáneas; un SELECT previo no podría.
  CONSTRAINT rental_order_no_overlap EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status <> 'cancelled')
);
CREATE INDEX rental_order_customer_idx ON core.rental_order (customer_id, created_at DESC);

CREATE TABLE core.outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text NOT NULL,
  payload      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX outbox_pending_idx ON core.outbox (created_at) WHERE published_at IS NULL;

CREATE TABLE core.audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id   uuid NOT NULL,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  uuid NOT NULL,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION app.rental_order_create(
  p_actor_id     uuid,
  p_customer_id  uuid,
  p_equipment_id uuid,
  p_start_date   date,
  p_end_date     date
)
RETURNS TABLE (id uuid, status text, start_date date, end_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  v_order core.rental_order;
BEGIN
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La fecha fin no puede ser anterior a la de inicio' USING ERRCODE = 'BR001';
  END IF;

  BEGIN
    INSERT INTO core.rental_order (customer_id, equipment_id, start_date, end_date, created_by)
    VALUES (p_customer_id, p_equipment_id, p_start_date, p_end_date, p_actor_id)
    RETURNING * INTO v_order;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'El equipo ya está reservado en esas fechas' USING ERRCODE = 'BR002';
  END;

  INSERT INTO core.audit_log (actor_id, action, entity, entity_id, after_data)
  VALUES (p_actor_id, 'create', 'rental_order', v_order.id, to_jsonb(v_order));

  -- Efecto externo: se publica después del commit.
  INSERT INTO core.outbox (event_type, payload)
  VALUES ('rental_order.created', jsonb_build_object('rentalOrderId', v_order.id));

  RETURN QUERY SELECT v_order.id, v_order.status, v_order.start_date, v_order.end_date;
END;
$$;

CREATE FUNCTION app.outbox_pending(p_limit integer)
RETURNS TABLE (id uuid, event_type text, payload jsonb)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT o.id, o.event_type, o.payload
  FROM core.outbox o
  WHERE o.published_at IS NULL
  ORDER BY o.created_at
  LIMIT least(p_limit, 500);
$$;

CREATE FUNCTION app.outbox_mark_published(p_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE core.outbox SET published_at = now()
  WHERE id = ANY (p_ids) AND published_at IS NULL;
$$;

-- migrate:down
DROP FUNCTION app.outbox_mark_published(uuid[]);
DROP FUNCTION app.outbox_pending(integer);
DROP FUNCTION app.rental_order_create(uuid, uuid, uuid, date, date);
DROP TABLE core.audit_log;
DROP TABLE core.outbox;
DROP TABLE core.rental_order;
