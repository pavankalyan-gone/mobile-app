import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { PERFEX_API_URL, PERFEX_TOKEN_KEY, MOCK_MODE } from '../constants/config';
import { authEvents } from '../utils/authEvents';

const perfexApi = axios.create({
  baseURL: PERFEX_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (__DEV__ && MOCK_MODE) {
  // Lazy require so the mock server is excluded from release bundles
  const { mockAdapter } = require('../utils/mockData');
  perfexApi.defaults.adapter = mockAdapter;
}

perfexApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(PERFEX_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

perfexApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Perfex is the primary backend: an invalid token means the session is over.
      await SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY);
      authEvents.emitUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default perfexApi;
