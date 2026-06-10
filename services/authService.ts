import axios from 'axios';
import estimatorApi from './estimatorApi';
import perfexApi from './perfexApi';
import * as SecureStore from '../utils/secureStore';
import { ESTIMATOR_TOKEN_KEY, PERFEX_TOKEN_KEY, ESTIMATOR_API_URL } from '../constants/config';

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
  estimatorToken: string;
  perfexToken: string;
  user: AuthUser;
}

export const authService = {
  /**
   * Logs into both backends with the same credentials.
   * Perfex CRM is the primary backend: nothing is persisted until it accepts
   * the credentials, so a rejected login can never leave an orphaned token
   * behind that would resurrect a half-broken session on the next launch.
   * The Estimator login is best-effort.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // 1. Authenticate with Perfex CRM (mandatory)
    const { data: perfexWrapper } = await perfexApi.post<any>('/auth/login', payload);
    const perfexToken: string = perfexWrapper.data?.access_token || perfexWrapper.access_token || '';
    if (!perfexToken) {
      throw new Error('No authentication token received from Perfex CRM.');
    }
    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    // 2. Authenticate with the Estimator app (optional)
    let estToken = '';
    let user: AuthUser = { id: 0, name: 'User', email: payload.email, role: 'staff' };
    try {
      const { data: estData } = await estimatorApi.post<{
        success: boolean;
        user: AuthUser;
        token: string;
      }>('/login', payload);
      estToken = estData.token;
      if (estData.user) user = estData.user;
      if (estToken) await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, estToken);
    } catch {
      if (__DEV__) console.warn('Estimator API login failed or not available, proceeding with Perfex only');
    }

    return { estimatorToken: estToken, perfexToken, user };
  },

  loginWithSSOToken: async (token: string): Promise<AuthResponse> => {
    let estToken = '';
    let user: AuthUser = { id: 0, name: 'CRM User', email: '', role: 'staff' };

    // 1. Exchange SSO token with Perfex CRM (mandatory)
    let perfexToken = '';
    try {
      const { data: exchangeData } = await perfexApi.post<any>('/auth/sso/exchange', { token });
      perfexToken = exchangeData.data?.access_token || exchangeData.access_token || exchangeData.data?.token || exchangeData.token;
      if (!perfexToken) {
        throw new Error('SSO exchange response is missing access token');
      }
    } catch (exchangeError: any) {
      if (__DEV__) console.warn('[authService] Web SSO exchange with Perfex failed');
      throw new Error(exchangeError?.response?.data?.error?.message || 'Access denied. Web SSO exchange with Perfex failed.');
    }
    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    // 2. Exchange SSO token with the Estimator app (optional). Use a bare axios
    //    call so the estimator interceptor doesn't attach a stale bearer token.
    try {
      const estimatorBaseUrl = ESTIMATOR_API_URL.replace(/\/api\/?$/, '');
      const ssoCallbackUrl = `${estimatorBaseUrl}/sso/callback?token=${encodeURIComponent(token)}`;
      const { data: estData } = await axios.get<any>(ssoCallbackUrl, {
        timeout: 10000,
        headers: { Accept: 'application/json' },
      });

      estToken = estData.token || estData.data?.token || '';
      if (estToken) {
        await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, estToken);
        if (estData.user) {
          user = {
            id: estData.user.id || 0,
            name: estData.user.name || 'CRM User',
            email: estData.user.email || '',
            role: estData.user.role || 'staff',
          };
        }
      }
    } catch {
      if (__DEV__) console.warn('[authService] Web SSO exchange with Estimator app failed or not available');
    }

    return { estimatorToken: estToken, perfexToken, user };
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
