#!/usr/bin/env node
// PreToolUse: bloquea comandos destructivos, aunque un permiso los hubiera permitido.
// Es una red de seguridad contra errores, no un límite contra un atacante:
// una lista de patrones siempre se puede rodear.
import { block, readCommand } from './lib.mjs';

const RULES = [
  [/\bgit\s+push\b[^\n;&|]*(\s--force\b|\s--force-with-lease\b|\s-[a-zA-Z]*f\b)/, 'git push forzado'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard: descarta trabajo'],
  [/\bgit\s+clean\s+-[a-zA-Z]*f/, 'git clean -f: borra archivos sin confirmación'],
  [/\brm\s+(-[a-zA-Z-]+\s+)*-[a-zA-Z]*r[a-zA-Z]*\s+(-[a-zA-Z-]+\s+)*["']?(\/|~|\$HOME|\.)["']?(\s|$)/, 'borrado recursivo de una raíz'],
  [/\bRemove-Item\b.*-Recurse\b.*\s["']?([A-Za-z]:\\?|\\|~|\.)["']?(\s|$)/i, 'borrado recursivo de una raíz'],
  [/\bprisma\s+(migrate|db\s+push)\b/, 'las migraciones son SQL en db/migrations; Prisma Migrate puede proponer borrar tablas'],
  [/\b(DROP\s+(DATABASE|SCHEMA)|TRUNCATE\s)/i, 'SQL destructivo: ejecútalo tú, revisándolo'],
  [/\bdocker\s+(compose\s+down\b[^\n;&|]*\s-v\b|volume\s+(rm|prune)\b|system\s+prune\b)/, 'borra volúmenes de Docker, con posibles datos'],
  [/\b(psql|pg_restore|dbmate)\b[^\n;&|]*\b(prod|production|staging)\b/i, 'comando de BD contra un entorno compartido'],
];

const command = await readCommand();
for (const [pattern, reason] of RULES) {
  if (pattern.test(command)) {
    block(`Bloqueado por guard-commands: ${reason}. Si es intencional, pídele a Fernando que lo ejecute.`);
  }
}
