import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/lib/api';
import { socketService } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            
            // Connect socket
            socketService.connect(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          throw new Error(response.message || 'Login failed');
        } catch (error: any) {
          const message = error.response?.data?.message || error.message || 'Login failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      register: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ name, email, password, phone });
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            
            // Connect socket
            socketService.connect(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          throw new Error(response.message || 'Registration failed');
        } catch (error: any) {
          const message = error.response?.data?.message || error.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('token');
          socketService.disconnect();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          if (response.success && response.data) {
            // Connect socket if not connected
            if (!socketService.isConnected()) {
              socketService.connect(token);
            }
            
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

