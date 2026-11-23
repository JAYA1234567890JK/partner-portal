const config = require('../src/config/env');
const { connectDatabase, disconnectDatabase, getPrismaClient } = require('../src/config/database');

async function verifyDatabaseReadWrite() {
  if (config.NODE_ENV === 'production') {
    throw new Error('The database smoke test is development-only.');
  }
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and set your Supabase PostgreSQL URLs.');
  }

  const prisma = getPrismaClient();
  if (!prisma) throw new Error('Prisma Client is not configured.');

  try {
    await connectDatabase();
    const marker = `roomly-smoke-${Date.now()}`;
    const rows = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`CREATE TEMPORARY TABLE roomly_backend_smoke_test (id INTEGER PRIMARY KEY, marker TEXT NOT NULL) ON COMMIT DROP`;
      await transaction.$executeRaw`INSERT INTO roomly_backend_smoke_test (id, marker) VALUES (1, ${marker})`;
      return transaction.$queryRaw`SELECT marker FROM roomly_backend_smoke_test WHERE id = 1`;
    });

    if (rows.length !== 1 || rows[0].marker !== marker) {
      throw new Error('Database smoke test read did not match the inserted value.');
    }
    console.info('[database-smoke-test] Temporary table insert/read passed; transaction cleanup removed the table.');
  } finally {
    await disconnectDatabase();
  }
}

verifyDatabaseReadWrite().catch((error) => {
  console.error('[database-smoke-test] Failed:', error.message);
  process.exitCode = 1;
});