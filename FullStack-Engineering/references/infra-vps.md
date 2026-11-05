# Infraestructura en VPS

Para el Perfil ERP (Contabo u otro VPS). Las medidas de seguridad están aquí porque son de servidor;
las de aplicación, en `security.md`. Perfil Express: `deployment.md`.

## Entornos

| Entorno | Dónde | Datos |
|---------|-------|-------|
| dev | Local, Docker Compose | Ficticios |
| staging | VPS o Compose separado, con su propia BD | Ficticios o anonimizados |
| prod | VPS | Reales |

Nunca copies datos reales a dev o staging sin anonimizar: siguen siendo datos personales.

## Hardening del VPS

1. Sistema actualizado; `unattended-upgrades` para parches de seguridad.
2. Usuario sin root con sudo y llave SSH. En `sshd_config`: `PermitRootLogin no`,
   `PasswordAuthentication no`. **Prueba una segunda sesión antes de cerrar la actual**, para no quedar
   fuera.
3. Firewall: abre solo 80, 443 y SSH (idealmente limitado por IP o tras VPN).
4. **Docker ignora UFW en los puertos publicados.** `ports: "5432:5432"` expone Postgres a internet aunque
   UFW lo bloquee. Publica solo el proxy, o usa `127.0.0.1:5432:5432`, y comunica los servicios por
   red interna. Verifica desde fuera con `nmap`.
5. fail2ban para SSH y Nginx/Caddy.
6. Contenedores sin root, imágenes con tag fijo, y sin montar `docker.sock` salvo necesidad clara.
7. Usa el panel de Contabo para firewall externo y snapshots si tu plan los ofrece; un snapshot no
   sustituye un backup externo.

## Docker Compose y proxy

Ver `assets/erp/infra/docker-compose.prod.yml`. Solo el reverse proxy publica puertos; `db` y `redis`
van en una red interna.

> **Decisión:** Caddy en proyectos nuevos. **Por qué:** TLS automático con muy poca configuración.
> **Descartado:** Nginx + Certbot. **Cuándo sí convendría:** si el VPS ya usa Nginx o requieres
> configuración avanzada. El Perfil Express ya trae `nginx.conf`.

Con un proxy delante, configura `trustProxy`; si no, el rate limit ve una sola IP para todos.

**Secretos:** `.env` en el servidor con permisos `600`, fuera del repo, o Docker secrets. Si un secreto
se filtró, se rota: borrarlo del repo no lo saca del historial.

**Deploy:** `docker compose pull`, migraciones como `erp_owner`, luego `up -d`. Con un solo VPS habrá un
corte breve; si es inaceptable, documenta blue/green antes de complicar la solución. Conserva la imagen
anterior para el rollback y aplica migraciones compatibles hacia atrás (expand/contract).

## Almacenamiento de objetos

> **Aviso.** Según fuentes secundarias revisadas en noviembre de 2026, MinIO Community Edition pasó a
> modo mantenimiento en diciembre de 2025 y su repositorio público fue archivado en abril de 2026.
> Confirma el estado en el repositorio oficial antes de decidir.
>
> **Decisión:** usar el API S3 a través de un puerto. **Por qué:** cambiar de proveedor queda como
> configuración. **Proyectos nuevos:** evalúa almacenamiento gestionado compatible con S3 (por ejemplo
> Contabo Object Storage) o alternativas auto-hospedadas (SeaweedFS, Garage) en vez de iniciar con MinIO.
> **Ingsergel:** no requiere migración urgente, pero planifícala porque ya no hay nuevas correcciones
> garantizadas. Mientras tanto, no expongas su consola ni su API a internet.

## Backups

La idea simple: un backup que nunca restauraste es solo una esperanza.

Define con el negocio **RPO** (cuántos datos se puede perder) y **RTO** (cuánto puede durar la caída).

| Dato | Método | Dónde |
|------|--------|-------|
| PostgreSQL | `pg_dump -Fc` diario; `pgBackRest` o WAL si el RPO es menor a 24 h | Fuera del VPS, cifrado |
| Archivos S3 | Replicación o `rclone` | Otro proveedor o región |
| Configuración | Repo sin secretos; secretos en un gestor | Separado |

- Regla **3-2-1:** 3 copias, 2 medios, 1 fuera del sitio. Un backup en el mismo VPS muere con el VPS.
- Retención (ejemplo): 7 diarios, 4 semanales, 12 mensuales. Revisa los plazos legales del dato.
- `assets/erp/infra/backup-postgres.sh` hace el backup.
- `assets/erp/infra/restore-test.sh` restaura en un contenedor temporal y valida. **Prográmalo como
  mínimo una vez al mes** y alerta si falla.
- Alerta también si **no llega** un backup, no solo si falla.

## Monitoreo

Empieza simple; agrega Prometheus y Grafana solo si hace falta.

- **Disponibilidad externa:** Uptime Kuma o equivalente, desde otro servidor, contra `/health`.
- **Logs:** JSON con `pino` y `request_id`, sin datos sensibles, con rotación.
- **Errores:** Sentry o GlitchTip, si se justifica.
- **Alertas mínimas:** disco > 80%, memoria, caída del servicio, backup ausente, cola BullMQ atascada,
  certificado por vencer, picos de 5xx. Cada alerta debe indicar a quién le llega y qué hacer.

## Checklist de salida a producción

- [ ] Hardening aplicado y puertos verificados desde fuera con `nmap`.
- [ ] HTTPS con redirección; helmet y CORS con dominios reales.
- [ ] `NODE_ENV=production`; secretos únicos para prod, sin valores de ejemplo.
- [ ] La app conecta como `erp_app`, y `erp_owner` solo en migraciones.
- [ ] Migraciones aplicadas en staging y probadas.
- [ ] Backup externo funcionando y **una restauración real probada**.
- [ ] Monitoreo y alertas probados, disparando una alerta real.
- [ ] Plan de rollback escrito.
- [ ] Cumplimiento revisado (`compliance-peru.md`).
- [ ] Criterios de aceptación firmados y usuarios capacitados.
