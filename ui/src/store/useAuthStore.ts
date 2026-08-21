import { create } from 'zustand';
import { authService } from '../services/authService';
import type { User } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  login: (user: User, token?: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem('gym_auth_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }
  return null;
};

const savedToken = localStorage.getItem('gym_auth_token');
const initialUser = getInitialUser();
const hasSavedSession = Boolean(savedToken);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: savedToken,
  isAuthenticated: hasSavedSession,
  isInitializing: hasSavedSession,

  setAuth: (user, token) => {
    localStorage.setItem('gym_auth_token', token);
    localStorage.setItem('gym_auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isInitializing: false });
  },

  login: (userData, token) => {
    const activeToken = token || get().token;
    if (activeToken) {
      localStorage.setItem('gym_auth_token', activeToken);
    }
    localStorage.setItem('gym_auth_user', JSON.stringify(userData));
    set({
      user: userData,
      token: activeToken,
      isAuthenticated: true,
      isInitializing: false,
    });
  },

  updateUser: (userData) => {
    localStorage.setItem('gym_auth_user', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: () => {
    localStorage.removeItem('gym_auth_token');
    localStorage.removeItem('gym_auth_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('gym_auth_token');
    if (!token) {
      set({ isInitializing: false, isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      const user = await authService.getMe(token);
      localStorage.setItem('gym_auth_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isInitializing: false,
      });
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem('gym_auth_token');
        localStorage.removeItem('gym_auth_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      } else {
        // Network error, server temporary down, etc. -> Keep saved session active!
        set({ isInitializing: false });
      }
    }
  },
}));