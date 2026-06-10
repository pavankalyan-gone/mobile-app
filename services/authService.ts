import perfexApi from './perfexApi';
import * as SecureStore from '../utils/secureStore';
import { PERFEX_TOKEN_KEY } from '../constants/config';

export interface LoginPayload {
  email: string;
  password: string;
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
  perfexToken: string;
  user: AuthUser;
}

/** Maps the staff profile returned alongside the token; falls back per field. */
const translateUser = (raw: any, fallback: AuthUser): AuthUser => {
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    id: Number(raw.id ?? raw.staffid ?? fallback.id) || fallback.id,
    name:
      raw.name ||
      [raw.firstname, raw.lastname].filter(Boolean).join(' ').trim() ||
      fallback.name,
    email: raw.email || fallback.email,
    role: raw.role || fallback.role,
    mobile_number: raw.mobile_number || raw.phonenumber || undefined,
    created_at: raw.created_at || undefined,
  };
};

export const authService = {
  /**
   * Logs into the unified Perfex CRM backend.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // 1. Authenticate with Perfex CRM
    const { data: perfexWrapper } = await perfexApi.post<any>('/auth/login', payload);
    const perfexToken: string = perfexWrapper.data?.access_token || perfexWrapper.access_token || '';
    if (!perfexToken) {
      throw new Error('No authentication token received from Perfex CRM.');
    }
    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    const user = translateUser(perfexWrapper.data?.user || perfexWrapper.user, {
      id: 0,
      name: 'User',
      email: payload.email,
      role: 'staff',
    });

    return { perfexToken, user };
  },

  loginWithSSOToken: async (token: string): Promise<AuthResponse> => {
    // 1. Exchange SSO token with Perfex CRM
    let perfexToken = '';
    let rawUser: any = null;
    try {
      const { data: exchangeData } = await perfexApi.post<any>('/auth/sso/exchange', { token });
      perfexToken = exchangeData.data?.access_token || exchangeData.access_token || exchangeData.data?.token || exchangeData.token;
      rawUser = exchangeData.data?.user || exchangeData.user || null;
      if (!perfexToken) {
        throw new Error('SSO exchange response is missing access token');
      }
    } catch (exchangeError: any) {
      if (__DEV__) console.warn('[authService] Web SSO exchange with Perfex failed');
      throw new Error(exchangeError?.response?.data?.error?.message || 'Access denied. Web SSO exchange with Perfex failed.');
    }
    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    const user = translateUser(rawUser, { id: 0, name: 'CRM User', email: '', role: 'staff' });

    return { perfexToken, user };
  },

  logout: async (): Promise<void> => {
    try {
      await perfexApi.post('/auth/logout');
    } catch (err) {
      if (__DEV__) console.warn('Perfex API logout failed', err);
    }
    await SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY);
  },

  getStoredPerfexToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(PERFEX_TOKEN_KEY);
  },
};
