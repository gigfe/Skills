#!/usr/bin/env bash
# Backup lógico a un remoto de rclone. Programar con cron o un timer de systemd.
# Requiere: BACKUP_REMOTE (ej. "offsite:erp-backups"), rclone configurado con un remoto cifrado (crypt).
set -euo pipefail
umask 077

DB_CONTAINER="${DB_CONTAINER:-erp-db-1}"
DB_NAME="${DB_NAME:-erp}"
BACKUP_REMOTE="${BACKUP_REMOTE:?define BACKUP_REMOTE}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
file="$work_dir/${DB_NAME}_$(date -u +%Y%m%dT%H%M%SZ).dump"

docker exec "$DB_CONTAINER" pg_dump -U postgres -d "$DB_NAME" -Fc > "$file"
# Un dump vacío o corrupto se detecta aquí, no el día que se necesita.
docker exec -i "$DB_CONTAINER" pg_restore --list < "$file" > /dev/null

rclone copy "$file" "$BACKUP_REMOTE/daily/"
rclone delete "$BACKUP_REMOTE/daily/" --min-age "${RETENTION_DAYS}d"

# Avisa al monitoreo; así salta una alerta si el backup deja de llegar.
if [ -n "${HEARTBEAT_URL:-}" ]; then
  curl -fsS -m 10 "$HEARTBEAT_URL" > /dev/null
fi
echo "Backup OK: $(basename "$file")"
