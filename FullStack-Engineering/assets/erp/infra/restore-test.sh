#!/usr/bin/env bash
# Restaura el último backup en un contenedor temporal y valida. Programar mínimo cada mes.
# Sale con error si algo falla, para que la alerta se dispare.
# Ajusta la consulta de validación a una tabla que siempre deba tener filas.
set -euo pipefail
umask 077

BACKUP_REMOTE="${BACKUP_REMOTE:?define BACKUP_REMOTE}"
DB_NAME="${DB_NAME:-erp}"
CHECK_SQL="${CHECK_SQL:-SELECT count(*) FROM core.audit_log}"
container="restore-test-$$"

work_dir="$(mktemp -d)"
cleanup() {
  docker rm -f "$container" > /dev/null 2>&1 || true
  rm -rf "$work_dir"
}
trap cleanup EXIT

latest="$(rclone lsf "$BACKUP_REMOTE/daily/" --files-only | sort | tail -n 1)"
[ -n "$latest" ] || { echo "No hay backups" >&2; exit 1; }
rclone copy "$BACKUP_REMOTE/daily/$latest" "$work_dir/"

# Red "none": el contenedor con datos reales no tiene salida. Trust auth solo porque no hay red.
docker run -d --name "$container" --network none \
  -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB="$DB_NAME" postgres:16 > /dev/null

ready=false
for _ in $(seq 1 60); do
  if docker exec "$container" pg_isready -U postgres -d "$DB_NAME" -h 127.0.0.1 > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
"$ready" || { echo "Postgres no arrancó" >&2; exit 1; }

# Roles globales: pg_dump no los incluye. Respalda también con pg_dumpall --roles-only.
docker exec "$container" psql -U postgres -c 'CREATE ROLE erp_owner; CREATE ROLE erp_app;' > /dev/null
docker exec -i "$container" pg_restore -U postgres -d "$DB_NAME" --exit-on-error < "$work_dir/$latest"

rows="$(docker exec "$container" psql -U postgres -d "$DB_NAME" -Atc "$CHECK_SQL")"
echo "Restauración OK de $latest. Resultado de validación: $rows"
