import axios from 'axios';

const baseURL = (process.env.REACT_APP_API_URL || 'https://partner-portal-2qbj.onrender.com/api').replace(/\/$/, '');
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

const unwrap = (response) => response.data.data;
const statusLabel = (status) => ({ PENDING_REVIEW: 'Pending review', APPROVED: 'Approved', REJECTED: 'Rejected', DRAFT: 'Draft' }[status] || status);
const dateLabel = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const mapApplication = (row) => ({
  ...row,
  propertyId: row.id,
  id: row.applicationReference || row.id,
  property: row.name,
  type: row.propertyType,
  owner: row.partner?.user?.fullName || row.partner?.contactName || 'Partner',
  email: row.partner?.user?.email || row.partner?.businessEmail || '',
  city: row.city,
  submitted: dateLabel(row.submittedAt),
  rooms: row.rooms?.length || 0,
  statusLabel: statusLabel(row.approvalStatus),
});
const mapProperty = (row) => ({
  ...row,
  name: row.name,
  type: row.propertyType,
  partner: row.partner?.user?.fullName || row.partner?.contactName || 'Partner',
  rooms: row._count?.rooms || 0,
  status: statusLabel(row.approvalStatus),
});
const mapPartner = (row) => ({
  ...row,
  name: row.user?.fullName || row.contactName,
  email: row.user?.email || row.businessEmail,
  city: row.city || '—',
  properties: row._count?.properties || 0,
  joined: dateLabel(row.createdAt),
  status: row.user?.isActive ? 'Active' : 'Inactive',
});

export const adminApi = {
  async login(credentials) { return (await api.post('/auth/admin/login', credentials)).data.data.user; },
  async me() { return (await api.get('/auth/admin/me')).data.data.user; },
  async logout() { await api.post('/auth/logout'); },
  async overview() { return unwrap(await api.get('/admin/overview')); },
  async applications(status = 'PENDING_REVIEW') { return unwrap(await api.get('/admin/applications', { params: { status } })).applications.map(mapApplication); },
  async properties(status = 'ALL') { return unwrap(await api.get('/admin/properties', { params: { status } })).properties.map(mapProperty); },
  async partners() { return unwrap(await api.get('/admin/partners')).partners.map(mapPartner); },
  async updatePropertyStatus(propertyId, status, reviewNote = '') {
    return unwrap(await api.patch(`/admin/properties/${encodeURIComponent(propertyId)}/status`, { status, reviewNote })).property;
  },
};

export function adminErrorMessage(error, fallback = 'The request could not be completed.') {
  if (!error?.response) return 'Cannot reach the Roomly API. Check your connection and try again.';
  return error.response.data?.message || fallback;
}
