import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { ESTIMATOR_API_URL, SSO_ACCESS_TOKEN_KEY, ESTIMATOR_TOKEN_KEY } from '../constants/config';
import { authEvents } from '../utils/authEvents';

const estimatorApi = axios.create({
  baseURL: ESTIMATOR_API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

estimatorApi.interceptors.request.use(async (config) => {
  let token = await SecureStore.getItemAsync(ESTIMATOR_TOKEN_KEY);
  if (!token) {
    token = await SecureStore.getItemAsync(SSO_ACCESS_TOKEN_KEY);
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

estimatorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authEvents.emitUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default estimatorApi;
