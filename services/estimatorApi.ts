import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { ESTIMATOR_API_URL, ESTIMATOR_TOKEN_KEY, MOCK_MODE } from '../constants/config';
import { mockAdapter } from '../utils/mockData';

const estimatorApi = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (MOCK_MODE) {
  estimatorApi.defaults.adapter = mockAdapter as any;
}

estimatorApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ESTIMATOR_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

estimatorApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[estimatorApi] Received 401 Unauthorized from:', error.config?.url);
      await SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY);
      // Re-evaluate auth state (will logout only if both tokens are gone)
      const { useAuthStore } = require('../store/authStore');
      console.log('[estimatorApi] Calling checkAuth() to re-evaluate session...');
      useAuthStore.getState().checkAuth();
    }
    return Promise.reject(error);
  }
);

export default estimatorApi;
