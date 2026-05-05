import { Platform } from 'react-native';

export const Colors = {
  primary: '#14A800',
  primaryDark: '#0E8000',
  black: '#000000',
  white: '#FFFFFF',
  dark: {
    background: '#0D0D0D',
    card: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    subtext: '#9BA1A6',
    inputBg: '#1E1E1E',
  },
  light: {
    background: '#FFFFFF',
    card: '#F7F7F7',
    border: '#E0E0E0',
    text: '#111111',
    subtext: '#6B7280',
    inputBg: '#F5F5F5',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
