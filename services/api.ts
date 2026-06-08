import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { ESTIMATOR_API_URL, ESTIMATOR_TOKEN_KEY, MOCK_MODE } from '../constants/config';
import { mockAdapter } from '../utils/mockData';

const api = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

if (MOCK_MODE) {
  api.defaults.adapter = mockAdapter as any;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ESTIMATOR_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY);
      // Navigate to login — handled in authStore
    }
    return Promise.reject(error);
  }
);

export default api;
