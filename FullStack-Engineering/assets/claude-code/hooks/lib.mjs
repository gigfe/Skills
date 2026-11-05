// Utilidades de los hooks. Un hook que falla con exit 1 NO bloquea (solo exit 2 lo hace),
// por eso los errores de lectura se convierten en bloqueo: la barrera falla cerrada.
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

export async function readCommand() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;

  let command;
  try {
    command = JSON.parse(raw)?.tool_input?.command;
  } catch {
    block('Hook: no se pudo leer la entrada.');
  }
  if (typeof command !== 'string') block('Hook: la entrada no trae un comando.');
  return command;
}
