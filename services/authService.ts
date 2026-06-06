import estimatorApi from './estimatorApi';
import perfexApi from './perfexApi';
import * as SecureStore from 'expo-secure-store';
import { ESTIMATOR_TOKEN_KEY, PERFEX_TOKEN_KEY } from '../constants/config';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile_number?: string;
  created_at?: string;
}

export interface AuthResponse {
  estimatorToken: string;
  perfexToken: string;
  user: AuthUser;
}

export const authService = {
  /**
   * Logs into both backends with the same credentials.
   * Estimator token and Perfex token are stored separately.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // Authenticate with Estimator app
    const { data: estData } = await estimatorApi.post<{
      success: boolean;
      user: AuthUser;
      token: string;
    }>('/login', payload);
    await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, estData.token);

    // Authenticate with Perfex CRM
    const { data: perfexWrapper } = await perfexApi.post<any>('/auth/login', payload);
    const perfexRaw = perfexWrapper.data;
    const perfexToken: string = perfexRaw.access_token;
    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    return {
      estimatorToken: estData.token,
      perfexToken,
      user: estData.user,
    };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    // Register only creates an account on the Estimator app.
    // Perfex CRM staff accounts are managed by admins — no self-registration.
    const { data: estData } = await estimatorApi.post<{
      success: boolean;
      user: AuthUser;
      token: string;
    }>('/register', payload);
    await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, estData.token);

    return {
      estimatorToken: estData.token,
      perfexToken: '',
      user: estData.user,
    };
  },

  logout: async (): Promise<void> => {
    // Best-effort logout on both backends
    await Promise.allSettled([
      estimatorApi.post('/logout'),
      perfexApi.post('/auth/logout'),
    ]);
    await Promise.all([
      SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY),
      SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY),
    ]);
  },

  getStoredEstimatorToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(ESTIMATOR_TOKEN_KEY);
  },

  getStoredPerfexToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(PERFEX_TOKEN_KEY);
  },
};
