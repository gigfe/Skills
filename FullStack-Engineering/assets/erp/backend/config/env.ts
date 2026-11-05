import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  // Conexión como erp_app. Las credenciales de erp_owner no llegan al proceso de la app.
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900),
  ALLOWED_ORIGINS: z.string().transform((value) => value.split(',').map((origin) => origin.trim())),
  // IP o CIDR del reverse proxy (ej. la subred de Docker). Sin definir: no se confía en ninguno.
  TRUST_PROXY: z.string().optional(),
});

// Falla al arrancar en vez de fallar en producción a mitad de un request.
export const env = schema.parse(process.env);
