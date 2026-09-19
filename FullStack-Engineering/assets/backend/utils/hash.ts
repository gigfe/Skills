import bcrypt from 'bcrypt';

// 12 es el piso recomendado actual (2024+) para bcrypt: suficientemente lento
// contra fuerza bruta sin volver el login perceptiblemente lento para el
// usuario real. Subirlo no cuesta nada de código, solo CPU en cada login.
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
