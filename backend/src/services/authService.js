const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPrismaClient } = require('../config/database');

const BCRYPT_ROUNDS = 12;

function getDatabase() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const error = new Error('Database is not configured.');
    error.status = 503;
    throw error;
  }
  return prisma;
}

function parseDurationMs(duration) {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) return 15 * 60 * 1000;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * units[match[2]];
}

function createAccessToken(user) {
  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
    const error = new Error('Authentication is not configured. Set JWT_SECRET to at least 32 characters.');
    error.status = 503;
    throw error;
  }
  return jwt.sign({ role: user.role }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: config.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

async function registerPartner(data) {
  const prisma = getDatabase();
  const duplicate = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (duplicate) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  try {
    return await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: 'PARTNER',
        },
        select: { id: true, fullName: true, email: true, role: true },
      });
      const partner = await transaction.partner.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          contactName: data.fullName,
          businessEmail: data.email,
          businessPhone: data.phone,
          businessType: data.businessType || null,
          city: data.city || null,
          state: data.state || null,
        },
        select: { id: true, businessName: true },
      });
      return { user, partner };
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const duplicateError = new Error('An account with this email already exists.');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

async function login(data) {
  const prisma = getDatabase();
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Run a bcrypt comparison on missing accounts too, reducing email enumeration timing differences.
  const hash = user ? user.passwordHash : '$2b$12$9u2nMfOt3OPAQqbfrGqxCOb1MiLe02f/d8IUT1qM0WHp/xWsLS6bO';
  const passwordMatches = await bcrypt.compare(data.password, hash);
  if (!user || !user.isActive || !passwordMatches) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }
  if (user.role !== 'PARTNER') {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }
  return { token: createAccessToken(user), user: { id: user.id, role: user.role } };
}

async function getCurrentPartner(userId) {
  const prisma = getDatabase();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, email: true, role: true, isActive: true,
      partner: { select: { id: true, businessName: true, businessType: true, city: true, state: true } },
    },
  });
  if (!user || !user.isActive || user.role !== 'PARTNER' || !user.partner) {
    const error = new Error('Authentication required.');
    error.status = 401;
    throw error;
  }
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    partnerId: user.partner.id,
    businessName: user.partner.businessName,
    businessType: user.partner.businessType,
    city: user.partner.city,
    state: user.partner.state,
  };
}

function getAuthCookieOptions() {
  const options = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api',
  };
  if (config.COOKIE_DOMAIN) options.domain = config.COOKIE_DOMAIN;
  return options;
}

function setAuthCookie(res, token) {
  res.cookie('roomly_access', token, {
    ...getAuthCookieOptions(),
    maxAge: parseDurationMs(config.JWT_EXPIRES_IN),
  });
}

function clearAuthCookie(res) {
  res.clearCookie('roomly_access', getAuthCookieOptions());
}

module.exports = { registerPartner, login, getCurrentPartner, setAuthCookie, clearAuthCookie };
