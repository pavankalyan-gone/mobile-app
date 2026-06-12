import axios from 'axios';
import { AUTH_SYSTEM_API_URL, SSO_ACCESS_TOKEN_KEY, SSO_REFRESH_TOKEN_KEY } from '../constants/config';
import * as SecureStore from '../utils/secureStore';
import { authEvents } from '../utils/authEvents';
import { Platform } from 'react-native';

const authApi = axios.create({
  baseURL: AUTH_SYSTEM_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Avoid infinite loops if refresh fails
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

authApi.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(SSO_ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh token itself failed, log out
        authEvents.emitUnauthorized();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return authApi(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(SSO_REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Get unique device identifier, in a real app use expo-device or similar. Here we use a generic 'mobile'.
        const deviceId = Platform.OS;

        const { data } = await axios.post(`${AUTH_SYSTEM_API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
          device_id: deviceId,
        });

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        await SecureStore.setItemAsync(SSO_ACCESS_TOKEN_KEY, newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(SSO_REFRESH_TOKEN_KEY, newRefreshToken);
        }

        authApi.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return authApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
        authEvents.emitUnauthorized();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default authApi;
