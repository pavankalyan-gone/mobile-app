import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { PERFEX_API_URL, PERFEX_TOKEN_KEY } from '../constants/config';

const perfexApi = axios.create({
  baseURL: PERFEX_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
