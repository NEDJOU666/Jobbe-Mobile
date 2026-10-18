import { useLanguageStore } from '@/store/languageStore';
import { TRANSLATIONS } from '@/i18n/translations';

export function useT() {
  const { language, setLanguage } = useLanguageStore();
  return { t: TRANSLATIONS[language], language, setLanguage };
}
