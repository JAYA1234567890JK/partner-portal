const crypto = require('crypto');
const { getPrismaClient } = require('../config/database');
const { deleteObjects, uploadObject } = require('../services/storageService');
const { extensionByMime } = require('../middleware/imageUpload');

const propertyBucket = 'property-images';
const roomBucket = 'room-images';

function database() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const error = new Error('Database is not configured.');
    error.status = 503;
    throw error;
  }
  return prisma;
}

function parseCategories(body, fileCount) {
  let categories;
  if (body.categories) {
    try { categories = JSON.parse(body.categories); } catch (_) { categories = null; }
    if (!Array.isArray(categories) || categories.length !== fileCount) {
      const error = new Error('Provide one image category per uploaded file.');
      error.status = 400;
      throw error;
    }
  } else categories = Array(fileCount).fill(body.category || 'Other Facilities');
  if (categories.some((category) => typeof category !== 'string' || !category.trim() || category.length > 80)) {
    const error = new Error('Image categories must be non-empty text up to 80 characters.');
    error.status = 400;
    throw error;
  }
  return categories.map((category) => category.trim());
}

function publicImage(image) {
  return {
    id: image.id,
    imageUrl: image.imageUrl,
    category: image.category,
    isCover: image.isCover,
    sortOrder: image.sortOrder,
    imageDetails: image.imageDetails,
    createdAt: image.createdAt,
  };
}

async function ensurePropertyOwnership(prisma, propertyId, partnerId) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, partnerId }, select: { id: true } });
  if (!property) {
    const error = new Error('Property not found.');
    error.status = 404;
    throw error;
  }
  return property;
}

async function ensureRoomOwnership(prisma, roomId, partnerId) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { is: { partnerId } } },
    select: { id: true, propertyId: true },
  });
  if (!room) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }
  return room;
}

async function uploadImages({ req, res, parentId, relation, bucket, ownerId }) {
  if (!req.files?.length) return res.status(400).json({ success: false, message: 'Choose at least one image to upload.' });
  const prisma = database();
  const parent = relation === 'property'
    ? await ensurePropertyOwnership(prisma, parentId, ownerId)
    : await ensureRoomOwnership(prisma, parentId, ownerId);
  const categories = parseCategories(req.body || {}, req.files.length);
  const uploadedObjects = [];
  try {
    for (let index = 0; index < req.files.length; index += 1) {
      const file = req.files[index];
      const extension = extensionByMime[file.mimetype];
      const storagePath = `${ownerId}/${parent.id}/${crypto.randomUUID()}.${extension}`;
      const object = await uploadObject(bucket, storagePath, file);
      uploadedObjects.push({ ...object, file, category: categories[index] });
    }

    const coverIndex = Number.isInteger(Number(req.body.coverIndex)) ? Number(req.body.coverIndex) : (req.body.isCover === 'true' ? 0 : -1);
    if (coverIndex < -1 || coverIndex >= uploadedObjects.length) {
      const error = new Error('coverIndex must refer to one of the uploaded images.');
      error.status = 400;
      throw error;
    }

    const created = await prisma.$transaction(async (transaction) => {
      const model = relation === 'property' ? transaction.propertyImage : transaction.roomImage;
      const where = relation === 'property' ? { propertyId: parent.id } : { roomId: parent.id };
      const previousCount = await model.count({ where });
      const selectedCoverIndex = coverIndex >= 0 ? coverIndex : (previousCount === 0 ? 0 : -1);
      if (selectedCoverIndex >= 0) await model.updateMany({ where: { ...where, isCover: true }, data: { isCover: false } });
      await model.createMany({
        data: uploadedObjects.map((object, index) => ({
          ...where,
          imageUrl: object.imageUrl,
          storagePath: object.storagePath,
          category: object.category,
          isCover: index === selectedCoverIndex,
          sortOrder: previousCount + index,
          imageDetails: { originalName: object.file.originalname, mimeType: object.file.mimetype, size: object.file.size },
        })),
      });
      return model.findMany({ where: { ...where, storagePath: { in: uploadedObjects.map((object) => object.storagePath) } }, orderBy: { sortOrder: 'asc' } });
    });
    return res.status(201).json({ success: true, data: { images: created.map(publicImage) } });
  } catch (error) {
    try { await deleteObjects(bucket, uploadedObjects.map((object) => object.storagePath)); }
    catch (cleanupError) { console.error('[storage] Failed to clean up an incomplete image upload:', cleanupError.message); }
    throw error;
  }
}

async function uploadPropertyImages(req, res, next) {
  try { return await uploadImages({ req, res, parentId: req.params.propertyId, relation: 'property', bucket: propertyBucket, ownerId: req.auth.partnerId }); }
  catch (error) { return next(error); }
}

async function listPropertyImages(req, res, next) {
  try {
    const prisma = database();
    await ensurePropertyOwnership(prisma, req.params.propertyId, req.auth.partnerId);
    const images = await prisma.propertyImage.findMany({ where: { propertyId: req.params.propertyId }, orderBy: { sortOrder: 'asc' } });
    return res.json({ success: true, data: { images: images.map(publicImage) } });
  } catch (error) { return next(error); }
}

async function updatePropertyImage(req, res, next) {
  try {
    const prisma = database();
    await ensurePropertyOwnership(prisma, req.params.propertyId, req.auth.partnerId);
    const where = { id: req.params.imageId, propertyId: req.params.propertyId };
    const current = await prisma.propertyImage.findFirst({ where });
    if (!current) return res.status(404).json({ success: false, message: 'Image not found.' });
    const data = imageUpdateData(req.body);
    const image = await prisma.$transaction(async (transaction) => {
      if (data.isCover) await transaction.propertyImage.updateMany({ where: { propertyId: req.params.propertyId }, data: { isCover: false } });
      return transaction.propertyImage.update({ where: { id: current.id }, data });
    });
    return res.json({ success: true, data: { image: publicImage(image) } });
  } catch (error) { return next(error); }
}

async function deletePropertyImage(req, res, next) {
  try {
    const prisma = database();
    await ensurePropertyOwnership(prisma, req.params.propertyId, req.auth.partnerId);
    const where = { id: req.params.imageId, propertyId: req.params.propertyId };
    const image = await prisma.propertyImage.findFirst({ where });
    if (!image) return res.status(404).json({ success: false, message: 'Image not found.' });
    await deleteObjects(propertyBucket, [image.storagePath]);
    await prisma.$transaction(async (transaction) => {
      await transaction.propertyImage.delete({ where: { id: image.id } });
      if (image.isCover) {
        const nextImage = await transaction.propertyImage.findFirst({ where: { propertyId: req.params.propertyId }, orderBy: { sortOrder: 'asc' } });
        if (nextImage) await transaction.propertyImage.update({ where: { id: nextImage.id }, data: { isCover: true } });
      }
    });
    return res.json({ success: true, message: 'Image deleted.' });
  } catch (error) { return next(error); }
}

async function orderPropertyImages(req, res, next) {
  try { return await updateImageOrder({ req, res, relation: 'property', parentId: req.params.propertyId, ownerId: req.auth.partnerId }); }
  catch (error) { return next(error); }
}

async function uploadRoomImages(req, res, next) {
  try { return await uploadImages({ req, res, parentId: req.params.roomId, relation: 'room', bucket: roomBucket, ownerId: req.auth.partnerId }); }
  catch (error) { return next(error); }
}

async function listRoomImages(req, res, next) {
  try {
    const prisma = database();
    await ensureRoomOwnership(prisma, req.params.roomId, req.auth.partnerId);
    const images = await prisma.roomImage.findMany({ where: { roomId: req.params.roomId }, orderBy: { sortOrder: 'asc' } });
    return res.json({ success: true, data: { images: images.map(publicImage) } });
  } catch (error) { return next(error); }
}

function imageUpdateData(body) {
  const data = {};
  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !body.category.trim() || body.category.length > 80) {
      const error = new Error('Image category must be non-empty text up to 80 characters.');
      error.status = 400;
      throw error;
    }
    data.category = body.category.trim();
  }
  if (body.isCover !== undefined) {
    if (typeof body.isCover !== 'boolean') {
      const error = new Error('isCover must be a boolean.');
      error.status = 400;
      throw error;
    }
    data.isCover = body.isCover;
  }
  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      const error = new Error('sortOrder must be a non-negative integer.');
      error.status = 400;
      throw error;
    }
    data.sortOrder = sortOrder;
  }
  if (!Object.keys(data).length) {
    const error = new Error('Provide an image category, cover selection, or sort order.');
    error.status = 400;
    throw error;
  }
  return data;
}

async function updateRoomImage(req, res, next) {
  try {
    const prisma = database();
    await ensureRoomOwnership(prisma, req.params.roomId, req.auth.partnerId);
    const where = { id: req.params.imageId, roomId: req.params.roomId };
    const current = await prisma.roomImage.findFirst({ where });
    if (!current) return res.status(404).json({ success: false, message: 'Image not found.' });
    const data = imageUpdateData(req.body);
    const image = await prisma.$transaction(async (transaction) => {
      if (data.isCover) await transaction.roomImage.updateMany({ where: { roomId: req.params.roomId }, data: { isCover: false } });
      return transaction.roomImage.update({ where: { id: current.id }, data });
    });
    return res.json({ success: true, data: { image: publicImage(image) } });
  } catch (error) { return next(error); }
}

async function deleteRoomImage(req, res, next) {
  try {
    const prisma = database();
    await ensureRoomOwnership(prisma, req.params.roomId, req.auth.partnerId);
    const where = { id: req.params.imageId, roomId: req.params.roomId };
    const image = await prisma.roomImage.findFirst({ where });
    if (!image) return res.status(404).json({ success: false, message: 'Image not found.' });
    await deleteObjects(roomBucket, [image.storagePath]);
    await prisma.$transaction(async (transaction) => {
      await transaction.roomImage.delete({ where: { id: image.id } });
      if (image.isCover) {
        const nextImage = await transaction.roomImage.findFirst({ where: { roomId: req.params.roomId }, orderBy: { sortOrder: 'asc' } });
        if (nextImage) await transaction.roomImage.update({ where: { id: nextImage.id }, data: { isCover: true } });
      }
    });
    return res.json({ success: true, message: 'Image deleted.' });
  } catch (error) { return next(error); }
}

async function orderRoomImages(req, res, next) {
  try { return await updateImageOrder({ req, res, relation: 'room', parentId: req.params.roomId, ownerId: req.auth.partnerId }); }
  catch (error) { return next(error); }
}

async function updateImageOrder({ req, res, relation, parentId, ownerId }) {
  const prisma = database();
  const parent = relation === 'property'
    ? await ensurePropertyOwnership(prisma, parentId, ownerId)
    : await ensureRoomOwnership(prisma, parentId, ownerId);
  const imageIds = req.body?.imageIds;
  if (!Array.isArray(imageIds) || imageIds.some((id) => typeof id !== 'string') || new Set(imageIds).size !== imageIds.length) {
    return res.status(400).json({ success: false, message: 'imageIds must be a list of unique image IDs.' });
  }
  const model = relation === 'property' ? prisma.propertyImage : prisma.roomImage;
  const where = relation === 'property' ? { propertyId: parent.id } : { roomId: parent.id };
  const current = await model.findMany({ where, select: { id: true } });
  if (current.length !== imageIds.length || current.some((image) => !imageIds.includes(image.id))) {
    return res.status(400).json({ success: false, message: 'Provide every image ID belonging to this parent in the desired order.' });
  }
  await prisma.$transaction(imageIds.map((id, sortOrder) => model.update({ where: { id }, data: { sortOrder } })));
  const images = await model.findMany({ where, orderBy: { sortOrder: 'asc' } });
  return res.json({ success: true, data: { images: images.map(publicImage) } });
}

module.exports = {
  uploadPropertyImages, listPropertyImages, updatePropertyImage, deletePropertyImage, orderPropertyImages,
  uploadRoomImages, listRoomImages, updateRoomImage, deleteRoomImage, orderRoomImages,
};
