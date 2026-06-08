import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { PERFEX_API_URL, PERFEX_TOKEN_KEY, MOCK_MODE } from '../constants/config';
import { mockAdapter } from '../utils/mockData';

const perfexApi = axios.create({
  baseURL: PERFEX_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (MOCK_MODE) {
  perfexApi.defaults.adapter = mockAdapter as any;
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
      await SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default perfexApi;
