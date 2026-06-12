import axios from 'axios';
import { eventBus } from '../utils/EventBus';
import * as SecureStore from 'expo-secure-store';

export const apiClient = axios.create({
  baseURL: 'https://api.example.com', // To be replaced with actual backend URL
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Phase 7 & 11: Access Revocation Detection
    if (error.response?.status === 403 && error.response?.data?.status === 'inactive') {
      eventBus.emit('AccessRevoked', error.response.data);
    } else if (error.response?.status === 401) {
      // Handle token refresh logic here
      // For now, if refresh fails, dispatch Logout
      eventBus.emit('Logout');
    }
    return Promise.reject(error);
  }
);
