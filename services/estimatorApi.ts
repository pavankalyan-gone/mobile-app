import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { ESTIMATOR_API_URL, ESTIMATOR_TOKEN_KEY, MOCK_MODE } from '../constants/config';

const estimatorApi = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (__DEV__ && MOCK_MODE) {
  // Lazy require so the mock server is excluded from release bundles
  const { mockAdapter } = require('../utils/mockData');
  estimatorApi.defaults.adapter = mockAdapter;
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
      // Estimator is the secondary backend — drop its token but keep the
      // session alive as long as the Perfex token is still valid.
      await SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default estimatorApi;
