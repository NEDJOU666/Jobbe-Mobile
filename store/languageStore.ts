import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import type { Language } from '@/i18n/translations';

const KEY = 'jobbe_language';
const SUPPORTED: Language[] = ['en', 'fr'];
const DEFAULT_LANGUAGE: Language = 'en';

function detectDeviceLanguage(): Language {
  try {
    const tag = Localization.getLocales()[0]?.languageCode;
    return SUPPORTED.includes(tag as Language) ? (tag as Language) : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

interface LanguageStore {
  language: Language;
  userHasChosen: boolean;
  hydrated: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: DEFAULT_LANGUAGE,
  userHasChosen: false,
  hydrated: false,

  setLanguage: async (language) => {
    set({ language, userHasChosen: true });
    try {
      await SecureStore.setItemAsync(KEY, language);
    } catch {}
  },

  // Device-language auto-detection only applies the first time the app runs
  // on a device (or after the user clears app data) — once someone picks a
  // language in Settings, that choice is sticky and detection never
  // overrides it again, same contract as the web app's language store.
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      if (saved && SUPPORTED.includes(saved as Language)) {
        set({ language: saved as Language, userHasChosen: true, hydrated: true });
      } else {
        set({ language: detectDeviceLanguage(), hydrated: true });
      }
    } catch {
      set({ language: detectDeviceLanguage(), hydrated: true });
    }
  },
}));
