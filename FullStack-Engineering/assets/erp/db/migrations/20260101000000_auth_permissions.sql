-- migrate:up
-- Roles como datos. El catálogo de códigos vive en el código; roles y concesiones, aquí.

CREATE TABLE core.app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.role (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE core.permission (
  code        text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE core.role_permission (
  role_id         uuid NOT NULL REFERENCES core.role (id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES core.permission (code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE core.user_role (
  user_id uuid NOT NULL REFERENCES core.app_user (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES core.role (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX user_role_role_idx ON core.user_role (role_id);

-- La comparación de bcrypt ocurre en la app; este SP solo entrega el hash de cuentas activas.
CREATE FUNCTION app.user_auth_lookup(p_email text)
RETURNS TABLE (id uuid, password_hash text)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT u.id, u.password_hash
  FROM core.app_user u
  WHERE u.email = lower(p_email) AND u.is_active;
$$;

CREATE FUNCTION app.user_permissions(p_user_id uuid)
RETURNS TABLE (code text)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT DISTINCT rp.permission_code
  FROM core.app_user u
  JOIN core.user_role ur ON ur.user_id = u.id
  JOIN core.role_permission rp ON rp.role_id = ur.role_id
  WHERE u.id = p_user_id AND u.is_active;
$$;

CREATE FUNCTION app.user_has_permission(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core.app_user u
    JOIN core.user_role ur ON ur.user_id = u.id
    JOIN core.role_permission rp ON rp.role_id = ur.role_id
    WHERE u.id = p_user_id AND u.is_active AND rp.permission_code = p_code
  );
$$;

-- migrate:down
DROP FUNCTION app.user_has_permission(uuid, text);
DROP FUNCTION app.user_permissions(uuid);
DROP FUNCTION app.user_auth_lookup(text);
DROP TABLE core.user_role;
DROP TABLE core.role_permission;
DROP TABLE core.permission;
DROP TABLE core.role;
DROP TABLE core.app_user;
