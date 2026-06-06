import { create } from 'zustand';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithSsoToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      notificationService.registerDeviceToken();
    } catch (err: any) {
      set({
        error: err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Check credentials.',
        isLoading: false,
      });
    }
  },

  loginWithSsoToken: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.ssoExchange(token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      notificationService.registerDeviceToken();
    } catch (err: any) {
      set({
        error: err.response?.data?.error?.message || err.response?.data?.message || 'SSO Exchange failed.',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = await authService.getStoredToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
      notificationService.registerDeviceToken();
    } catch {
      await authService.logout();
      set({ isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
