import axios from 'axios';
import estimatorApi from './estimatorApi';
import perfexApi from './perfexApi';
import * as SecureStore from '../utils/secureStore';
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
    let estToken = '';
    let user: AuthUser = { id: 0, name: 'User', email: payload.email, role: 'staff' };
    
    // Attempt to authenticate with Estimator app (may fail if local server is down)
    try {
      const { data: estData } = await estimatorApi.post<{
        success: boolean;
        user: AuthUser;
        token: string;
      }>('/login', payload);
      estToken = estData.token;
      user = estData.user;
      await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, estToken);
    } catch (error) {
      console.warn('Estimator API login failed or not available, proceeding with Perfex only');
    }

    // Authenticate directly with Perfex CRM
    let perfexToken = '';
    try {
      console.log('[authService] Attempting direct login to Perfex CRM...');
      const { data: perfexWrapper } = await perfexApi.post<any>('/auth/login', payload);
      perfexToken = perfexWrapper.data?.access_token || perfexWrapper.access_token || '';
      console.log('[authService] Direct login successful.');
    } catch (error) {
      console.error('[authService] Direct login failed:', error);
      throw error;
    }

    if (perfexToken) {
      await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);
    } else {
      throw new Error('No authentication token received from Perfex CRM.');
    }

    return {
      estimatorToken: estToken,
      perfexToken,
      user: user,
    };
  },

  loginWithSSOToken: async (token: string): Promise<AuthResponse> => {
    let perfexToken = '';
    try {
      console.log('[authService] Attempting to exchange Web SSO token for Perfex CRM token...');
      const { data: exchangeData } = await perfexApi.post<any>('/auth/sso/exchange', { token });
      perfexToken = exchangeData.data?.access_token || exchangeData.access_token || exchangeData.data?.token || exchangeData.token;
      if (!perfexToken) {
        throw new Error('SSO exchange response is missing access token');
      }
      console.log('[authService] Web SSO token exchanged successfully.');
    } catch (exchangeError: any) {
      console.error('[authService] Web SSO exchange failed:', exchangeError?.response?.data || exchangeError);
      throw new Error(exchangeError?.response?.data?.error?.message || 'Access denied. Web SSO exchange failed.');
    }

    await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, perfexToken);

    // Provide a placeholder user for SSO since we might not have a `/me` endpoint immediately
    const user: AuthUser = { id: 0, name: 'CRM User', email: '', role: 'staff' };

    return {
      estimatorToken: '', // SSO might not grant an estimator token yet
      perfexToken,
      user,
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
