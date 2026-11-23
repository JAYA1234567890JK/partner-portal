import api from './api';

let draftSaveQueue = Promise.resolve();

function serverSafeDraft(draft) {
  const { bank: _bankDetails, images: _images, ...safeDraft } = draft;
  return { ...safeDraft, rooms: (draft.rooms || []).map(({ photos: _photos, ...room }) => room) };
}

export function mapPropertyResponse(property) {
  if (!property) return null;
  const data = property.onboardingData || {};
  const statusMap = { DRAFT: 'Draft', PENDING_REVIEW: 'Pending Approval', APPROVED: 'Approved', REJECTED: 'Rejected' };
  return {
    ...property,
    business: { ...(data.business || {}), name: property.name, propertyType: property.propertyType },
    location: data.location || { address1: property.address, landmark: property.landmark, city: property.city, state: property.state, pincode: property.pincode },
    images: (property.images || []).map((image) => ({ ...image, dataUrl: image.imageUrl, cover: image.isCover })),
    rooms: (property.rooms || []).map((room) => ({
      ...room, name: room.roomName, category: room.roomType, maxGuests: room.capacity,
      beds: room.bedCount, available: room.status === 'AVAILABLE',
      status: room.status === 'AVAILABLE' ? 'Available' : room.status === 'INACTIVE' ? 'Inactive' : 'Under Review',
    })),
    pricing: data.pricing || {},
    policies: data.policies || {},
    status: statusMap[property.approvalStatus] || property.approvalStatus,
    reference: property.applicationReference,
  };
}

export async function getOnboardingDraft() {
  const response = await api.get('/partner/onboarding/draft');
  return response.data.data.draft;
}

export async function saveOnboardingDraft(draft) {
  const saveTask = draftSaveQueue.catch(() => {}).then(() => api.put('/partner/onboarding/draft', { draft: serverSafeDraft(draft) }));
  draftSaveQueue = saveTask;
  const response = await saveTask;
  return response.data.data;
}

export async function submitOnboarding(draft) {
  await draftSaveQueue.catch(() => {});
  const response = await api.post('/partner/properties', { draft: serverSafeDraft(draft) });
  return response.data.data.property;
}

export async function getProperties() {
  const response = await api.get('/partner/properties');
  return response.data.data.properties.map(mapPropertyResponse);
}

export async function getPartnerDashboard() {
  const response = await api.get('/partner/dashboard');
  return { ...response.data.data, property: mapPropertyResponse(response.data.data.property) };
}

export async function uploadPropertyImages(propertyId, files, category, onProgress) {
  return uploadImages('properties', propertyId, files, category, onProgress);
}

export async function uploadRoomImages(roomId, files, category, onProgress) {
  return uploadImages('rooms', roomId, files, category, onProgress);
}

async function uploadImages(parentType, parentId, files, category, onProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file, file.name));
  formData.append('categories', JSON.stringify(files.map(() => category)));
  const response = await api.post(`/${parentType}/${encodeURIComponent(parentId)}/images`, formData, {
    onUploadProgress(event) {
      if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return response.data.data.images;
}

export async function deletePropertyImage(propertyId, imageId) {
  return api.delete(`/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(imageId)}`);
}

export async function deleteRoomImage(roomId, imageId) {
  return api.delete(`/rooms/${encodeURIComponent(roomId)}/images/${encodeURIComponent(imageId)}`);
}

export async function updatePropertyImage(propertyId, imageId, changes) {
  const response = await api.patch(`/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(imageId)}`, changes);
  return response.data.data.image;
}

export async function updateRoomImage(roomId, imageId, changes) {
  const response = await api.patch(`/rooms/${encodeURIComponent(roomId)}/images/${encodeURIComponent(imageId)}`, changes);
  return response.data.data.image;
}

export async function updatePropertyImageOrder(propertyId, imageIds) {
  const response = await api.patch(`/properties/${encodeURIComponent(propertyId)}/images/order`, { imageIds });
  return response.data.data.images;
}

export async function updateRoomImageOrder(roomId, imageIds) {
  const response = await api.patch(`/rooms/${encodeURIComponent(roomId)}/images/order`, { imageIds });
  return response.data.data.images;
}
