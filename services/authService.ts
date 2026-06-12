import authApi from './authApi';
import * as SecureStore from '../utils/secureStore';
import { SSO_ACCESS_TOKEN_KEY, SSO_REFRESH_TOKEN_KEY, ESTIMATOR_TOKEN_KEY, PERFEX_TOKEN_KEY } from '../constants/config';
import { Platform } from 'react-native';

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
  accessToken: string;
  refreshToken: string;
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
   * Logs into the centralized Auth System for SSO.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const deviceId = Platform.OS; // Use a more unique device ID in production
    const { data: authData } = await authApi.post<any>('/auth/login', {
      ...payload,
      device_id: deviceId,
    });
    
    const accessToken: string = authData.access_token || authData.data?.access_token || '';
    const refreshToken: string = authData.refresh_token || authData.data?.refresh_token || '';
    
    if (!accessToken) {
      throw new Error('No authentication token received from Central Auth System.');
    }
    
    await SecureStore.setItemAsync(SSO_ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(SSO_REFRESH_TOKEN_KEY, refreshToken);
    }

    const user = translateUser(authData.user || authData.data?.user, {
      id: 0,
      name: 'User',
      email: payload.email,
      role: 'staff',
    });

    return { accessToken, refreshToken, user };
  },

  loginWithSSOToken: async (token: string): Promise<AuthResponse> => {
    // Save as fallback
    await SecureStore.setItemAsync(SSO_ACCESS_TOKEN_KEY, token);

    let user: AuthUser = {
      id: 0,
      name: 'User',
      email: '',
      role: 'staff',
    };

    try {
      const { jwtDecode } = require('jwt-decode');
      const decoded = jwtDecode(token) as any;
      
      // Save token to correct specific storage based on token audience
      if (decoded.aud && decoded.aud.includes('estimator')) {
        await SecureStore.setItemAsync(ESTIMATOR_TOKEN_KEY, token);
        console.log('[AuthService] Saved Estimator specific token');
      } else if (decoded.aud && decoded.aud.includes('crm')) {
        await SecureStore.setItemAsync(PERFEX_TOKEN_KEY, token);
        console.log('[AuthService] Saved CRM specific token');
      }

      user = translateUser({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        ...decoded
      }, user);
    } catch (e) {
      console.warn('Failed to decode SSO JWT token', e);
    }

    return {
      accessToken: token,
      refreshToken: '', // Refresh token might not be provided in the initial SSO callback
      user,
    };
  },

  logout: async (): Promise<void> => {
    try {
      const deviceId = Platform.OS;
      await authApi.post('/auth/logout', { device_id: deviceId });
    } catch (err) {
      if (__DEV__) console.warn('Auth System logout failed', err);
    }
    await SecureStore.deleteItemAsync(SSO_ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SSO_REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ESTIMATOR_TOKEN_KEY);
    await SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY);
  },

  getStoredToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(SSO_ACCESS_TOKEN_KEY);
  },
};
