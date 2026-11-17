export const ACTIVE_PARTNER_KEY = 'roomlyActivePartner';
const REGISTRATIONS_KEY = 'partnerRegistrations';
const DRAFTS_KEY = 'roomlyPropertyDrafts';
const PROPERTIES_KEY = 'roomlyProperties';
const BOOKINGS_KEY = 'roomlyBookings';
const PAYMENTS_KEY = 'roomlyPayments';

const read = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const normalizeEmail = (email = '') => email.trim().toLowerCase();
export const getActiveEmail = () => normalizeEmail(localStorage.getItem(ACTIVE_PARTNER_KEY) || '');
export const setActiveEmail = (email) => localStorage.setItem(ACTIVE_PARTNER_KEY, normalizeEmail(email));
export const getRegistrations = () => read(REGISTRATIONS_KEY, []);
export const getActivePartner = () => getRegistrations().find((partner) => normalizeEmail(partner.email) === getActiveEmail()) || (getActiveEmail() === 'partner@example.com' ? { fullName: 'Alex Morgan', businessName: 'The Willow House', email: 'partner@example.com', mobile: '+91 98765 43210' } : null);
export const getPartnerDraft = (email = getActiveEmail()) => read(DRAFTS_KEY, {})[normalizeEmail(email)] || {};
export const savePartnerDraft = (draft, email = getActiveEmail()) => { const drafts = read(DRAFTS_KEY, {}); drafts[normalizeEmail(email)] = { ...draft, updatedAt: new Date().toISOString() }; write(DRAFTS_KEY, drafts); };
export const getProperties = (email = getActiveEmail()) => read(PROPERTIES_KEY, {})[normalizeEmail(email)] || [];
export const saveProperties = (properties, email = getActiveEmail()) => { const all = read(PROPERTIES_KEY, {}); all[normalizeEmail(email)] = properties; write(PROPERTIES_KEY, all); };
export const getBookings = () => read(BOOKINGS_KEY, []);
export const saveBookings = (bookings) => write(BOOKINGS_KEY, bookings);
export const getPayments = () => read(PAYMENTS_KEY, []);
export const savePayments = (payments) => write(PAYMENTS_KEY, payments);
export const submitProperty = (draft, email = getActiveEmail()) => {
  const properties = getProperties(email);
  const property = { ...draft, id: draft.id || `RM-${Date.now().toString(36).toUpperCase()}`, status: 'Pending Approval', submittedAt: new Date().toISOString(), reference: `RML-${Date.now().toString().slice(-8)}` };
  saveProperties([property, ...properties.filter((item) => item.id !== property.id)], email);
  return property;
};
export const getPartnerStatus = (email = getActiveEmail()) => {
  const properties = getProperties(email);
  if (properties.some((property) => property.status === 'Approved')) return 'approved';
  if (properties.some((property) => property.status === 'Pending Approval')) return 'pending';
  return 'onboarding';
};
