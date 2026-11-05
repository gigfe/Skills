#!/usr/bin/env node
// PreToolUse de los agentes revisores: solo permite comandos de lectura, de uno en uno.
// Lista de permitidos, no de prohibidos; y sin encadenar, redirigir ni sustituir comandos.
import { block, readCommand } from './lib.mjs';

const ALLOWED = [
  /^git (diff|log|show|status|blame|ls-files)(\s|$)/,
  /^npm audit(\s+--[\w=-]+)*$/, // excluye `npm audit fix`
  /^npm (ls|outdated)(\s|$)/,
];

const command = (await readCommand()).trim();

if (/[;&|<>`\n\r]|\$\(/.test(command)) {
  block('Revisor en solo lectura: sin encadenar, redirigir ni sustituir comandos.');
}
if (/\s--(output|ext-diff|exec|textconv)(=|\s|$)/.test(command) || /\s--fix(\s|$)/.test(command)) {
  block('Revisor en solo lectura: esa opción puede escribir o ejecutar código.');
}
if (!ALLOWED.some((pattern) => pattern.test(command))) {
  block(`Revisor en solo lectura: comando no permitido: ${command.slice(0, 120)}`);
}
