#!/usr/bin/env node
// PreToolUse: antes de un commit hecho por Claude, corre `npm run verify`; si falla, lo bloquea.
// Solo protege commits de Claude. La garantía para todos vive en CI.
import { spawnSync } from 'node:child_process';
import { block, readCommand } from './lib.mjs';

const command = await readCommand();
if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

const result = spawnSync('npm run verify', {
  cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
  encoding: 'utf8',
  shell: true,
  timeout: 570_000,
});

if (result.status !== 0) {
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().slice(-4000);
  block(`Commit bloqueado: npm run verify falló. Corrige la causa, no la verificación.\n${output}`);
}
