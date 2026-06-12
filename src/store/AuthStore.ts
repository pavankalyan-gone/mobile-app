import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { eventBus } from '../utils/EventBus';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, refreshToken, user) => {
    await SecureStore.setItemAsync('access_token', token);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    
    set({ user, isAuthenticated: true });
    eventBus.emit('LoginSuccess');
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    
    set({ user: null, isAuthenticated: false });
    eventBus.emit('Logout');
  },

  checkSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userData = await SecureStore.getItemAsync('user');
      
      if (token && userData) {
        set({ user: JSON.parse(userData), isAuthenticated: true });
      }
    } catch (e) {
      console.error('Session check failed', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Setup listeners
eventBus.on('AccessRevoked', () => {
  useAuthStore.getState().logout();
});

eventBus.on('Logout', () => {
  // If emitted from elsewhere, ensure store state clears
  if (useAuthStore.getState().isAuthenticated) {
    useAuthStore.getState().logout();
  }
});
