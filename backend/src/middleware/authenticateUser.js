const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPrismaClient } = require('../config/database');

async function authenticateUser(req, res, next) {
  const token = req.cookies && req.cookies.roomly_access;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
    return res.status(503).json({ success: false, message: 'Authentication is not configured.' });
  }
  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (!payload.sub || !payload.role) throw new Error('Invalid token identity');
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    const prisma = getPrismaClient();
    if (!prisma) return res.status(503).json({ success: false, message: 'Database is not configured.' });
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, partner: { select: { id: true } } },
    });
    if (!user || !user.isActive || user.role !== payload.role) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    req.auth = { userId: user.id, role: user.role, partnerId: user.partner && user.partner.id };
    return next();
  } catch (error) { return next(error); }
}

module.exports = authenticateUser;
