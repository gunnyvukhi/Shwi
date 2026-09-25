import { create } from 'zustand';
import type { CSSProperties } from 'react';
import { getThemeStyles } from '../config/theme';

interface ThemeState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setDarkTheme: (isDark: boolean) => void;
  getThemeStyles: () => CSSProperties;
}

const STORAGE_KEY = 'shwi_theme';

const getInitialTheme = (): boolean => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'dark' : true;
  }
  return true;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkTheme: getInitialTheme(),

  toggleTheme: () => {
    set((state) => {
      const next = !state.isDarkTheme;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      }
      return { isDarkTheme: next };
    });
  },

  setDarkTheme: (isDark: boolean) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    }
    set({ isDarkTheme: isDark });
  },

  getThemeStyles: () => getThemeStyles(get().isDarkTheme),
}));

// Alias for flexibility
export const useTheme = useThemeStore;
export default useThemeStore;
