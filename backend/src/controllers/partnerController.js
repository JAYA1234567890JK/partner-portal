const crypto = require('crypto');
const { getPrismaClient } = require('../config/database');
const { deleteObjects } = require('../services/storageService');

function requireDatabase() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const error = new Error('Database is not configured.');
    error.status = 503;
    throw error;
  }
  return prisma;
}

function snapshotFromDraft(draft = {}) {
  const { bank: _bank, images: _images, rooms: _rooms, ...rest } = draft;
  return {
    ...rest,
    rooms: (draft.rooms || []).map(({ photos: _photos, ...room }) => room),
  };
}

function roomFields(room) {
  return {
    roomNumber: String(room.roomNumber || '').trim(),
    roomName: String(room.name || room.category || 'Room').trim(),
    roomType: String(room.category || 'Standard'),
    capacity: Math.max(1, Number(room.maxGuests) || 1),
    bedCount: Math.max(1, Number(room.beds) || 1),
    description: room.description || null,
    status: room.available ? 'AVAILABLE' : 'INACTIVE',
    verificationStatus: 'PENDING',
    roomDetails: {
      bedType: room.bedType || '', size: room.size || '', bathroom: room.bathroom || '',
      amenities: room.amenities || [],
    },
  };
}

function pricingForDraft(draft) {
  const standardPricing = [
    [1, draft.pricing?.oneHour], [2, draft.pricing?.twoHours], [3, draft.pricing?.threeHours],
    [6, draft.pricing?.sixHours], [12, draft.pricing?.twelveHours],
  ].filter(([hours, price]) => Number.isInteger(hours) && hours > 0 && Number(price) >= 0 && price !== '')
    .map(([durationHours, price]) => [durationHours, String(price)]);

  // A custom duration can overlap a standard duration (for example, 1 hour).
  // Keep the explicitly named standard rate in that case so Prisma's
  // @@unique([roomId, durationHours]) constraint is never violated.
  const pricesByDuration = new Map(standardPricing);
  const customDuration = Number(draft.pricing?.customDuration);
  const customPrice = draft.pricing?.customPrice;
  if (
    Number.isInteger(customDuration) &&
    customDuration > 0 &&
    Number(customPrice) >= 0 &&
    customPrice !== '' &&
    !pricesByDuration.has(customDuration)
  ) {
    pricesByDuration.set(customDuration, String(customPrice));
  }

  return Array.from(pricesByDuration, ([durationHours, price]) => ({
    durationHours,
    price,
    isActive: true,
  }));
}

async function syncRooms(transaction, propertyId, draft) {
  const existingRooms = await transaction.room.findMany({
    where: { propertyId },
    include: { images: { select: { storagePath: true } } },
  });
  const existingById = new Map(existingRooms.map((room) => [room.id, room]));
  const keptIds = [];
  const orphanedStoragePaths = [];
  const pricing = pricingForDraft(draft);

  for (const room of draft.rooms || []) {
    let id = typeof room.id === 'string' && room.id ? room.id : undefined;
    const fields = roomFields(room);
    const existing = id ? existingById.get(id) : null;
    let savedRoom;
    if (existing) {
      savedRoom = await transaction.room.update({ where: { id }, data: fields });
      await transaction.hourlyPricing.deleteMany({ where: { roomId: id } });
      if (pricing.length) await transaction.hourlyPricing.createMany({ data: pricing.map((item) => ({ ...item, roomId: id })) });
    } else {
      // Room IDs can come from a local onboarding draft. If the same draft is
      // used to start a different property, never reuse an ID owned elsewhere.
      if (id) {
        const conflictingRoom = await transaction.room.findUnique({ where: { id }, select: { propertyId: true } });
        if (conflictingRoom) id = undefined;
      }
      savedRoom = await transaction.room.create({
        data: { ...fields, ...(id ? { id } : {}), propertyId, hourlyPricing: { create: pricing } },
      });
    }
    keptIds.push(savedRoom.id);
  }

  const removedRooms = existingRooms.filter((room) => !keptIds.includes(room.id));
  for (const room of removedRooms) for (const image of room.images) if (image.storagePath) orphanedStoragePaths.push(image.storagePath);
  if (removedRooms.length) await transaction.room.deleteMany({ where: { id: { in: removedRooms.map((room) => room.id) } } });
  return orphanedStoragePaths;
}

function propertyFields(draft, status) {
  const business = draft.business || {};
  const location = draft.location || {};
  return {
    name: String(business.name || '').trim() || 'Untitled property',
    propertyType: String(business.propertyType || 'Hotel'),
    description: business.description || null,
    address: [location.address1, location.address2].filter(Boolean).join(', ') || 'Address pending',
    landmark: location.landmark || null,
    city: String(location.city || '').trim() || 'Pending',
    state: String(location.state || '').trim() || 'Pending',
    pincode: String(location.pincode || '').trim() || '000000',
    latitude: location.latitude != null && location.latitude !== '' && Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : null,
    longitude: location.longitude != null && location.longitude !== '' && Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : null,
    approvalStatus: status,
    onboardingData: snapshotFromDraft(draft),
  };
}

async function persistDraft(prisma, partnerId, draft, submitted) {
  const result = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.property.findFirst({
      where: { partnerId, approvalStatus: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    const fields = propertyFields(draft, submitted ? 'PENDING_REVIEW' : 'DRAFT');
    const applicationReference = submitted
      ? `RML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      : undefined;
    if (existing) {
      const property = await transaction.property.update({
        where: { id: existing.id },
        data: {
          ...fields,
          ...(submitted ? { applicationReference, submittedAt: new Date() } : {}),
        },
        include: { images: true },
      });
      const orphanedStoragePaths = await syncRooms(transaction, property.id, draft);
      const rooms = await transaction.room.findMany({ where: { propertyId: property.id }, include: { images: true, hourlyPricing: true } });
      return { property: { ...property, rooms }, orphanedStoragePaths };
    }
    const property = await transaction.property.create({
      data: {
        ...fields,
        partnerId,
        ...(submitted ? { applicationReference, submittedAt: new Date() } : {}),
      },
      include: { images: true },
    });
    const orphanedStoragePaths = await syncRooms(transaction, property.id, draft);
    const rooms = await transaction.room.findMany({ where: { propertyId: property.id }, include: { images: true, hourlyPricing: true } });
    return { property: { ...property, rooms }, orphanedStoragePaths };
  });
  if (result.orphanedStoragePaths.length) {
    try { await deleteObjects('room-images', result.orphanedStoragePaths); }
    catch (error) { console.error('[storage] Could not remove images for deleted rooms:', error.message); }
  }
  return result.property;
}

function draftFromProperty(property) {
  const snapshot = property.onboardingData || {};
  return {
    ...snapshot,
    propertyId: property.id,
    images: (property.images || []).map((image) => ({ ...(image.imageDetails || {}), id: image.id, name: image.imageDetails?.originalName || '', category: image.category, imageUrl: image.imageUrl, cover: image.isCover, isCover: image.isCover, sortOrder: image.sortOrder, uploaded: Boolean(image.storagePath) })),
    rooms: (property.rooms || []).map((room) => ({
      id: room.id, roomNumber: room.roomNumber, name: room.roomName, category: room.roomType,
      maxGuests: room.capacity, beds: room.bedCount, available: room.status === 'AVAILABLE',
      description: room.description || '', ...(room.roomDetails || {}),
      photos: (room.images || []).map((image) => ({ ...(image.imageDetails || {}), id: image.id, name: image.imageDetails?.originalName || '', category: image.category, imageUrl: image.imageUrl, isCover: image.isCover, sortOrder: image.sortOrder, uploaded: Boolean(image.storagePath) })),
    })),
  };
}

async function getDraft(req, res, next) {
  try {
    const prisma = requireDatabase();
    const property = await prisma.property.findFirst({
      where: { partnerId: req.auth.partnerId, approvalStatus: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } }, rooms: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
    });
    return res.json({ success: true, data: { draft: property ? draftFromProperty(property) : null } });
  } catch (error) { return next(error); }
}

async function saveDraft(req, res, next) {
  try {
    if (!req.auth.partnerId) return res.status(403).json({ success: false, message: 'Partner profile is required.' });
    const prisma = requireDatabase();
    const draft = req.body.draft || {};
    if (draft.propertyId) {
      const submitted = await prisma.property.findFirst({
        where: { id: draft.propertyId, partnerId: req.auth.partnerId, approvalStatus: { in: ['PENDING_REVIEW', 'APPROVED'] } },
        select: { id: true, approvalStatus: true, rooms: { select: { id: true } } },
      });
      if (submitted) return res.json({ success: true, message: 'Property is already submitted for review.', data: { id: submitted.id, status: submitted.approvalStatus, alreadySubmitted: true } });
    } else if (Array.isArray(draft.rooms) && draft.rooms.length && draft.rooms.every((room) => typeof room.id === 'string' && room.id)) {
      // Some older browser drafts predate propertyId persistence. Resolve them
      // by their stable room IDs so autosave does not try to clone a submission.
      const roomIds = [...new Set(draft.rooms.map((room) => room.id))];
      const submittedProperties = await prisma.property.findMany({
        where: { partnerId: req.auth.partnerId, approvalStatus: { in: ['PENDING_REVIEW', 'APPROVED'] } },
        select: { id: true, approvalStatus: true, rooms: { select: { id: true } } },
      });
      const submitted = submittedProperties.find((property) =>
        property.rooms.length === roomIds.length && property.rooms.every((room) => roomIds.includes(room.id)),
      );
      if (submitted) return res.json({ success: true, message: 'Property is already submitted for review.', data: { id: submitted.id, status: submitted.approvalStatus, alreadySubmitted: true } });
    }
    const property = await persistDraft(prisma, req.auth.partnerId, draft, false);
    return res.json({ success: true, message: 'Draft saved.', data: { id: property.id, status: property.approvalStatus } });
  } catch (error) { return next(error); }
}

async function submitProperty(req, res, next) {
  try {
    if (!req.auth.partnerId) return res.status(403).json({ success: false, message: 'Partner profile is required.' });
    const draft = req.body.draft;
    if (!draft.business?.name || !draft.location?.address1 || !draft.location?.city || !draft.location?.state || !draft.location?.pincode || !draft.rooms?.length) {
      return res.status(400).json({ success: false, message: 'Complete required property, location, and room details before submitting.' });
    }
    const prisma = requireDatabase();
    const submittedStatuses = ['PENDING_REVIEW', 'APPROVED'];
    let alreadySubmitted = draft.propertyId
      ? await prisma.property.findFirst({
          where: { id: draft.propertyId, partnerId: req.auth.partnerId, approvalStatus: { in: submittedStatuses } },
          select: { id: true, name: true, approvalStatus: true, applicationReference: true, submittedAt: true, rooms: { select: { id: true } } },
        })
      : null;

    // Older local drafts may not have retained propertyId. Match their stable
    // room IDs to make a retry after a successful submit idempotent as well.
    if (!alreadySubmitted) {
      const roomIds = [...new Set((draft.rooms || []).map((room) => room.id).filter(Boolean))];
      if (roomIds.length === draft.rooms.length) {
        const submittedProperties = await prisma.property.findMany({
          where: { partnerId: req.auth.partnerId, approvalStatus: { in: submittedStatuses } },
          select: { id: true, name: true, approvalStatus: true, applicationReference: true, submittedAt: true, rooms: { select: { id: true } } },
        });
        alreadySubmitted = submittedProperties.find((property) =>
          property.rooms.length === roomIds.length && property.rooms.every((room) => roomIds.includes(room.id)),
        ) || null;
      }
    }

    if (alreadySubmitted) {
      return res.status(200).json({
        success: true,
        message: 'Property has already been submitted for review.',
        data: { property: { id: alreadySubmitted.id, name: alreadySubmitted.name, approvalStatus: alreadySubmitted.approvalStatus, applicationReference: alreadySubmitted.applicationReference, submittedAt: alreadySubmitted.submittedAt } },
      });
    }

    const property = await persistDraft(prisma, req.auth.partnerId, draft, true);
    return res.status(201).json({
      success: true,
      message: 'Property submitted for review.',
      data: { property: { id: property.id, name: property.name, approvalStatus: property.approvalStatus, applicationReference: property.applicationReference, submittedAt: property.submittedAt } },
    });
  } catch (error) { return next(error); }
}

async function listProperties(req, res, next) {
  try {
    const prisma = requireDatabase();
    const properties = await prisma.property.findMany({
      where: { partnerId: req.auth.partnerId },
      orderBy: { createdAt: 'desc' },
      include: { images: { where: { isCover: true }, take: 1 }, rooms: { include: { hourlyPricing: true } } },
    });
    return res.json({ success: true, data: { properties } });
  } catch (error) { return next(error); }
}

async function getDashboard(req, res, next) {
  try {
    const prisma = requireDatabase();
    const properties = await prisma.property.findMany({
      where: { partnerId: req.auth.partnerId },
      orderBy: { createdAt: 'desc' },
      include: { images: { where: { isCover: true }, take: 1 }, rooms: true },
    });
    const property = properties[0] || null;
    const rooms = property?.rooms || [];
    return res.json({
      success: true,
      data: {
        property,
        totals: {
          properties: properties.length,
          rooms: rooms.length,
          availableRooms: rooms.filter((room) => room.status === 'AVAILABLE').length,
          pendingRooms: rooms.filter((room) => ['PENDING', 'UNDER_REVIEW'].includes(room.verificationStatus)).length,
          bookings: 0,
          revenue: 0,
        },
        bookings: [],
        payments: [],
      },
    });
  } catch (error) { return next(error); }
}

module.exports = { getDraft, saveDraft, submitProperty, listProperties, getDashboard };
