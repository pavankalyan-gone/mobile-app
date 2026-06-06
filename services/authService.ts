import estimatorApi from './estimatorApi';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../constants/config';

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
  token: string;
  user: AuthUser;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await estimatorApi.post<{ success: boolean; user: AuthUser; token: string }>('/login', payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return { token: data.token, user: data.user };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await estimatorApi.post<{ success: boolean; user: AuthUser; token: string }>('/register', payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return { token: data.token, user: data.user };
  },

  logout: async (): Promise<void> => {
    try {
      await estimatorApi.post('/logout');
    } catch (e) {
      console.warn('Backend logout failed or offline:', e);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },

  getStoredToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
};
