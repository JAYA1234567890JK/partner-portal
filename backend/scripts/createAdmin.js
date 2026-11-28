require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const adminId = (process.env.BOOTSTRAP_ADMIN_ID || 'roomlyadmin').trim().toLowerCase();
  const fullName = (process.env.BOOTSTRAP_ADMIN_NAME || 'Roomly Administrator').trim();
  const configuredPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!/^[a-z0-9._-]{3,64}$/.test(adminId)) throw new Error('BOOTSTRAP_ADMIN_ID must be 3–64 letters, digits, dots, underscores, or hyphens.');
  if (configuredPassword && configuredPassword.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters.');

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { adminId } });
    if (existing && existing.role !== 'ADMIN') throw new Error('That Admin ID is assigned to a non-admin user.');
    if (existing && !configuredPassword) throw new Error('This admin already exists. Set BOOTSTRAP_ADMIN_PASSWORD to rotate its password.');

    const generatedPassword = existing ? null : (configuredPassword || crypto.randomBytes(18).toString('base64url'));
    const passwordHash = await bcrypt.hash(generatedPassword || configuredPassword, 12);
    const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || `${adminId}@admin.roomly.invalid`).trim().toLowerCase();
    const admin = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { fullName, passwordHash, isActive: true } })
      : await prisma.user.create({ data: { fullName, email, adminId, passwordHash, role: 'ADMIN', isActive: true } });

    console.info(`Admin account ready. Admin ID: ${admin.adminId}`);
    if (!configuredPassword && generatedPassword) {
      console.info(`Generated one-time password: ${generatedPassword}`);
      console.info('Save this password now. It will not be shown again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[admin:create] Failed:', error.message);
  process.exitCode = 1;
});
