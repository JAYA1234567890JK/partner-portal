const config = require('./env');

const prismaGlobal = globalThis;

function getPrismaClient() {
  if (!config.DATABASE_URL) return null;
  if (!prismaGlobal.roomlyPrisma) {
    const { PrismaClient } = require('@prisma/client');
    prismaGlobal.roomlyPrisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaGlobal.roomlyPrisma;
}

async function connectDatabase() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.warn('[database] DATABASE_URL is empty; skipping PostgreSQL connection.');
    return false;
  }
  try {
    await prisma.$connect();
    console.info('[database] Supabase PostgreSQL connection established.');
    return true;
  } catch (error) {
    console.error('[database] PostgreSQL connection failed:', error.message);
    throw error;
  }
}

async function disconnectDatabase() {
  const prisma = getPrismaClient();
  if (!prisma) return;
  try {
    await prisma.$disconnect();
    console.info('[database] Prisma client disconnected.');
  } catch (error) {
    console.error('[database] Prisma disconnect failed:', error.message);
    throw error;
  }
}

module.exports = { getPrismaClient, connectDatabase, disconnectDatabase };