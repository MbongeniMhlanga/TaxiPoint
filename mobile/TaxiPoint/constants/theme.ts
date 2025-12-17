/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Blue-600
const tintColorDark = '#60A5FA'; // Blue-400

export const Colors = {
  light: {
    text: '#111827', // gray-900
    background: '#F9FAFB', // gray-50
    tint: tintColorLight,
    icon: '#6B7280', // gray-500
    tabIconDefault: '#9CA3AF', // gray-400
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F3F4F6', // gray-100
    background: '#111827', // gray-900
    tint: tintColorDark,
    icon: '#9CA3AF', // gray-400
    tabIconDefault: '#6B7280', // gray-500
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
