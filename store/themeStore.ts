import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'jobbe_theme';

interface ThemeStore {
  isDark: boolean;
  toggle: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,

  toggle: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    try { await SecureStore.setItemAsync(KEY, next ? 'dark' : 'light'); } catch {}
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      if (saved === 'light') set({ isDark: false });
    } catch {}
  },
}));
