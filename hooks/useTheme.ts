import { useThemeStore } from '@/store/themeStore';

export const DARK = {
  bg: '#0D0D0D',
  card: '#141414',
  card2: '#0F0F0F',
  input: '#161616',
  border: '#1A1A1A',
  border2: '#252525',
  border3: '#2A2A2A',
  text: '#FFFFFF',
  textSub: '#DDDDDD',
  textBody: '#888888',
  textMuted: '#555555',
  textDim: '#333333',
  icon: '#AAAAAA',
  accent: '#14A800',
  accentBg: '#14A80015',
  accentBorder: '#14A80030',
  tabBar: '#0D0D0D',
  tabBorder: '#1A1A1A',
  tabInactive: '#444444',
  statusBar: 'light' as const,
};

export const LIGHT = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  card2: '#F0F2F5',
  input: '#ECEEF2',
  border: '#E5E7EB',
  border2: '#D1D5DB',
  border3: '#CBD0D8',
  text: '#111827',
  textSub: '#1F2937',
  textBody: '#6B7280',
  textMuted: '#9CA3AF',
  textDim: '#D1D5DB',
  icon: '#6B7280',
  accent: '#14A800',
  accentBg: '#F0FFF0',
  accentBorder: '#AAEAAA',
  tabBar: '#FFFFFF',
  tabBorder: '#E5E7EB',
  tabInactive: '#9CA3AF',
  statusBar: 'dark' as const,
};

export type ThemeColors = typeof DARK;

export function useTheme() {
  const { isDark, toggle } = useThemeStore();
  return {
    colors: isDark ? DARK : LIGHT,
    isDark,
    toggle,
  };
}
