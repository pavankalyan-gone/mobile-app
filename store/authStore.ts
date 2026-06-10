import { create } from 'zustand';
import * as SecureStore from '../utils/secureStore';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { authEvents } from '../utils/authEvents';
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
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login({ email, password });
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      notificationService.registerDeviceToken();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || 'Login failed. Check credentials.',
        isLoading: false,
      });
    }
  },

  handleSSOLogin: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.loginWithSSOToken(token);
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      notificationService.registerDeviceToken();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || 'SSO Login failed.',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await notificationService.deregisterDeviceToken();
    await authService.logout();
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    // Also reset error: logging out with an already-expired token trips the
    // 401 handler below, which would leave "session expired" on the login screen.
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
  },

  checkAuth: async () => {
    // Perfex CRM is the primary backend — without its token there is no session.
    const perfexToken = await authService.getStoredPerfexToken();
    if (!perfexToken) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    let user: User | null = null;
    try {
      const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null; // corrupted stored profile must not crash startup
    }
    set({ user, isAuthenticated: true });
  },

  clearError: () => set({ error: null }),
}));

// The API layer emits this when the primary backend rejects the token (401).
authEvents.onUnauthorized(() => {
  SecureStore.deleteItemAsync(USER_STORAGE_KEY).catch(() => {});
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    error: 'Your session has expired. Please sign in again.',
  });
});
