import axios from 'axios';

// Keep the base URL configurable when a partner API is introduced.
const apiClient = axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL || '/api', timeout: 15000, headers: { 'Content-Type': 'application/json' } });

export default apiClient;
