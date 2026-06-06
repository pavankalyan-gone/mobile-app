import api from './api';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/config';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data: wrapper } = await api.post<any>('/auth/login', payload);
    const crmData = wrapper.data;

    const authData: AuthResponse = {
      token: crmData.access_token,
      refresh_token: crmData.refresh_token || '',
      user: {
        id: crmData.user.id,
        name: `${crmData.user.firstname} ${crmData.user.lastname}`,
        email: crmData.user.email,
        role: crmData.user.is_admin ? 'admin' : 'staff',
      }
    };

    await SecureStore.setItemAsync(TOKEN_KEY, authData.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refresh_token);
    return authData;
  },

  ssoExchange: async (ssoToken: string): Promise<AuthResponse> => {
    const { data: wrapper } = await api.post<any>('/auth/sso/exchange', { token: ssoToken });
    const crmData = wrapper.data;

    const authData: AuthResponse = {
      token: crmData.access_token,
      refresh_token: crmData.refresh_token || '',
      user: {
        id: crmData.staff.id,
        name: `${crmData.staff.firstname} ${crmData.staff.lastname}`,
        email: crmData.staff.email,
        role: crmData.staff.is_admin ? 'admin' : 'staff',
      }
    };

    await SecureStore.setItemAsync(TOKEN_KEY, authData.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refresh_token);
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed or offline:', e);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  },

  getStoredToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  getMe: async () => {
    const { data: wrapper } = await api.get<any>('/auth/me');
    const crmUser = wrapper.data;

    return {
      id: crmUser.id,
      name: `${crmUser.firstname} ${crmUser.lastname}`,
      email: crmUser.email,
      role: crmUser.admin ? 'admin' : 'staff',
    };
  },
};
