const { getPrismaClient } = require('../config/database');

function database() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const error = new Error('Database is not configured.');
    error.status = 503;
    throw error;
  }
  return prisma;
}

async function getOverview(_req, res, next) {
  try {
    const prisma = database();
    const [statusCounts, partners, rooms] = await Promise.all([
      prisma.property.groupBy({ by: ['approvalStatus'], _count: { _all: true } }),
      prisma.partner.count(),
      prisma.room.count(),
    ]);
    const counts = Object.fromEntries(statusCounts.map((entry) => [entry.approvalStatus, entry._count._all]));
    return res.json({
      success: true,
      data: { totals: {
        pendingApplications: counts.PENDING_REVIEW || 0,
        approvedProperties: counts.APPROVED || 0,
        rejectedProperties: counts.REJECTED || 0,
        partners,
        rooms,
        bookings: 0,
        revenue: 0,
      } },
    });
  } catch (error) { return next(error); }
}

async function listApplications(req, res, next) {
  try {
    const prisma = database();
    const status = req.query.status || 'PENDING_REVIEW';
    const allowed = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid application status.' });
    const properties = await prisma.property.findMany({
      where: status === 'ALL' ? { approvalStatus: { not: 'DRAFT' } } : { approvalStatus: status },
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        partner: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
        images: { orderBy: { sortOrder: 'asc' } },
        rooms: { orderBy: { createdAt: 'asc' }, include: { images: { orderBy: { sortOrder: 'asc' } }, hourlyPricing: { orderBy: { durationHours: 'asc' } } } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
    });
    return res.json({ success: true, data: { applications: properties } });
  } catch (error) { return next(error); }
}

async function listProperties(req, res, next) {
  try {
    const prisma = database();
    const status = req.query.status;
    const allowed = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'];
    if (status && !allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid property status.' });
    const properties = await prisma.property.findMany({
      where: status && status !== 'ALL' ? { approvalStatus: status } : { approvalStatus: { not: 'DRAFT' } },
      orderBy: { updatedAt: 'desc' },
      include: {
        partner: { include: { user: { select: { fullName: true, email: true, phone: true } } } },
        images: { where: { isCover: true }, take: 1 },
        _count: { select: { rooms: true } },
      },
    });
    return res.json({ success: true, data: { properties } });
  } catch (error) { return next(error); }
}

async function listPartners(_req, res, next) {
  try {
    const partners = await database().partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true } }, _count: { select: { properties: true } } },
    });
    return res.json({ success: true, data: { partners } });
  } catch (error) { return next(error); }
}

async function updatePropertyStatus(req, res, next) {
  try {
    const prisma = database();
    const existing = await prisma.property.findUnique({ where: { id: req.params.propertyId }, select: { id: true, approvalStatus: true } });
    if (!existing || existing.approvalStatus === 'DRAFT') {
      return res.status(404).json({ success: false, message: 'Submitted property application not found.' });
    }
    const updated = await prisma.$transaction(async (transaction) => {
      const property = await transaction.property.update({
        where: { id: req.params.propertyId },
        data: {
          approvalStatus: req.validatedBody.status,
          reviewNote: req.validatedBody.reviewNote || null,
          reviewedAt: new Date(),
          reviewedById: req.auth.userId,
        },
      });
      await transaction.room.updateMany({
        where: { propertyId: property.id },
        data: { verificationStatus: req.validatedBody.status === 'APPROVED' ? 'VERIFIED' : 'REJECTED' },
      });
      return property;
    });
    return res.json({ success: true, message: `Property ${updated.approvalStatus.toLowerCase()}.`, data: { property: updated } });
  } catch (error) { return next(error); }
}

module.exports = { getOverview, listApplications, listProperties, listPartners, updatePropertyStatus };
