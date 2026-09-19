import { PrismaClient } from '@prisma/client';

// Singleton con patrón `global` para no acumular conexiones en cada hot-reload
// de `tsx watch`/`ts-node-dev` durante desarrollo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
