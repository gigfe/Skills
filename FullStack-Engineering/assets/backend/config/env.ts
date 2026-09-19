import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

// Falla rápido en el arranque si falta o está mal una variable — mejor que
// descubrirlo a mitad de un request en producción.
export const env = envSchema.parse(process.env);
