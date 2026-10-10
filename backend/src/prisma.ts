import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client for the whole process.
 *
 * IMPORTANT: creating a `new PrismaClient()` per module opens a *separate*
 * connection pool for each one (default pool size is ~2x the CPU count). This
 * app used to create 10 of them, which exhausts Supabase's pooler — session
 * mode caps total clients at `pool_size` (often 15) — producing
 * `EMAXCONNSESSION: max clients reached in session mode` errors.
 *
 * Always import `prisma` from this module instead of instantiating a new one.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

// Reuse the client across hot reloads (nodemon/ts-node) so pools aren't leaked.
globalForPrisma.prisma = prisma;

export default prisma;
