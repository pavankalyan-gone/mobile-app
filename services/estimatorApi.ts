import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ESTIMATOR_API_URL, ESTIMATOR_TOKEN_KEY } from '../constants/config';

const estimatorApi = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

estimatorApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ESTIMATOR_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

estimatorApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default estimatorApi;
