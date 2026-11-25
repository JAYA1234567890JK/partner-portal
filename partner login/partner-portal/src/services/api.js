import axios from 'axios';

const baseURL = (process.env.REACT_APP_API_URL || 'https://partner-portal-2qbj.onrender.com/api').replace(/\/$/, '');

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  config.withCredentials = true;
  config.headers.Accept = 'application/json';
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') config.headers.delete('Content-Type');
    else delete config.headers['Content-Type'];
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !/\/auth\/(login|register|me|logout)$/.test(url) && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roomly:session-expired'));
    }
    if (!error.response) error.message = 'Unable to reach Roomly. Check your connection and try again.';
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) return 'Unable to reach Roomly. Check your connection and try again.';
  return error.response.data?.message || fallback;
}

export default api;
