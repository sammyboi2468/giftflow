import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hardcode your connection string with the added connect_timeout parameter
const neonConnectionString = "postgresql://neondb_owner:npg_Bx0jJqVAe1kt@ep-autumn-cake-avkl05e9-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30";

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || neonConnectionString,
      },
    },
    log: ['query', 'error', 'warn'], // This enables query logs so we can see what's happening
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;