-- Corre UNA vez por base de datos, como superuser, conectado a la base del proyecto:
--   psql -d erp -v owner_password=... -v app_password=... -f bootstrap-roles.sql
-- Pasa las contraseñas desde un gestor de secretos; no las dejes en el historial del shell.
\set ON_ERROR_STOP on

CREATE ROLE erp_owner LOGIN PASSWORD :'owner_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE erp_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;

ALTER ROLE erp_app SET statement_timeout = '15s';
ALTER ROLE erp_app SET idle_in_transaction_session_timeout = '30s';

REVOKE ALL ON DATABASE :"DBNAME" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"DBNAME" TO erp_owner, erp_app;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO erp_owner;  -- operator classes de extensiones al migrar

CREATE SCHEMA core AUTHORIZATION erp_owner;  -- tablas: privadas
CREATE SCHEMA app  AUTHORIZATION erp_owner;  -- rutinas: la API de la base

-- Requerida por la restricción EXCLUDE del ejemplo. Elimínala si no la usas.
CREATE EXTENSION IF NOT EXISTS btree_gist;

GRANT USAGE ON SCHEMA app TO erp_app;

-- Sin IN SCHEMA a propósito: un default por esquema no puede quitar el EXECUTE global de PUBLIC.
ALTER DEFAULT PRIVILEGES FOR ROLE erp_owner REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE erp_owner IN SCHEMA app GRANT EXECUTE ON ROUTINES TO erp_app;
