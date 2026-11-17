import { getRegistrations, normalizeEmail, setActiveEmail } from './partnerData';

export const DEMO_CREDENTIALS = { email: 'partner@example.com', password: 'Partner@123' };
export function authenticatePartner(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const isDemoPartner = normalizedEmail === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
  const registeredPartner = getRegistrations().find((partner) => normalizeEmail(partner.email) === normalizedEmail && partner.password === password);
  if (!isDemoPartner && !registeredPartner) return false;
  setActiveEmail(normalizedEmail);
  return true;
}
export function savePartnerRegistration(registration) {
  const registrations = getRegistrations();
  registrations.push({ ...registration, createdAt: new Date().toISOString() });
  localStorage.setItem('partnerRegistrations', JSON.stringify(registrations));
}
