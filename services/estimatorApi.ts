import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ESTIMATOR_API_URL, TOKEN_KEY } from '../constants/config';

const estimatorApi = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

estimatorApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default estimatorApi;
