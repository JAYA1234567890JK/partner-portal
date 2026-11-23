import api from './api';

export async function loginPartner(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function registerPartner(registration) {
  const response = await api.post('/auth/register', {
    fullName: registration.fullName,
    businessName: registration.businessName,
    email: registration.email,
    phone: registration.mobile.replace(/[^\d+]/g, ''),
    businessType: registration.businessType,
    city: registration.city,
    state: registration.state,
    password: registration.password,
    confirmPassword: registration.confirmPassword,
  });
  return response.data;
}

export async function getCurrentPartner() {
  const response = await api.get('/auth/me');
  return response.data.data.user;
}

export async function logoutPartner() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export function toPartnerProfile(user) {
  if (!user) return null;
  return {
    id: user.partnerId,
    partnerId: user.partnerId,
    userId: user.userId,
    fullName: user.fullName,
    businessName: user.businessName,
    email: user.email,
    role: user.role,
    businessType: user.businessType,
    city: user.city,
    state: user.state,
  };
}
