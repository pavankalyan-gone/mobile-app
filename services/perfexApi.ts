import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { PERFEX_API_URL, TOKEN_KEY } from '../constants/config';

const perfexApi = axios.create({
  baseURL: PERFEX_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

perfexApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default perfexApi;
