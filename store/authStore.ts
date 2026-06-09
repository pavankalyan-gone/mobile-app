import { create } from 'zustand';
import * as SecureStore from '../utils/secureStore';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { USER_STORAGE_KEY } from '../constants/config';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile_number?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  handleSSOLogin: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    console.log('[authStore] Initiating login for:', email);
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login({ email, password });
      console.log('[authStore] Login success. Received tokens:', {
        estToken: !!data.estimatorToken,
        perfexToken: !!data.perfexToken
      });
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      console.log('[authStore] Auth state set to authenticated = true');
      notificationService.registerDeviceToken();
    } catch (err: any) {
      console.error('[authStore] Login failed:', err);
      set({
        error: err.response?.data?.message || 'Login failed. Check credentials.',
        isLoading: false,
      });
    }
  },

  handleSSOLogin: async (token) => {
    console.log('[authStore] Initiating SSO Login');
    set({ isLoading: true, error: null });
    try {
      const data = await authService.loginWithSSOToken(token);
      console.log('[authStore] SSO Login success. Tokens stored.');
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      console.log('[authStore] Auth state set to authenticated = true');
      notificationService.registerDeviceToken();
    } catch (err: any) {
      console.error('[authStore] SSO Login failed:', err);
      set({
        error: 'SSO Login failed.',
        isLoading: false,
      });
    }
  },

  register: async (name, email, password, passwordConfirmation) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      notificationService.registerDeviceToken();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Registration failed.',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    console.log('[authStore] Executing logout... clearing everything.');
    await notificationService.deregisterDeviceToken();
    await authService.logout();
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    set({ user: null, isAuthenticated: false });
    console.log('[authStore] Auth state set to authenticated = false');
  },

  checkAuth: async () => {
    console.log('[authStore] checkAuth started.');
    // Session is valid if either the Estimator token OR Perfex token exists
    const estToken = await authService.getStoredEstimatorToken();
    const perfexToken = await authService.getStoredPerfexToken();
    
    console.log(`[authStore] checkAuth tokens -> estToken: ${!!estToken}, perfexToken: ${!!perfexToken}`);

    if (!estToken && !perfexToken) {
      console.log('[authStore] Both tokens missing! Setting isAuthenticated = false');
      set({ isAuthenticated: false });
      return;
    }
    const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    set({ user, isAuthenticated: true });
    console.log('[authStore] checkAuth complete. Setting isAuthenticated = true');
  },

  clearError: () => set({ error: null }),
}));
