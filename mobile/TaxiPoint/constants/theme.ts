/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Blue-600
const tintColorDark = '#60A5FA'; // Blue-400

export const Colors = {
  light: {
    text: '#111827', // Deep Charcoal
    textSecondary: '#6B7280', // Cool Gray
    background: '#FFFFFF', // Pure White
    secondaryBackground: '#F3F4F6', // Light Gray Surface
    tint: '#2563EB', // Primary Brand Blue
    primaryColor: '#2563EB',
    icon: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    surface: '#FFFFFF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#2563EB',
  },
  dark: {
    text: '#F9FAFB', // Off-White
    textSecondary: '#9CA3AF', // Gray
    background: '#111827', // Deep Blue-Black (Modern Dark Mode)
    secondaryBackground: '#1F2937', // Lighter Dark Surface
    tint: '#3B82F6', // Lighter Blue for Dark Mode
    primaryColor: '#3B82F6',
    icon: '#9CA3AF',
    border: '#374151',
    error: '#EF4444',
    success: '#10B981',
    surface: '#1F2937',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#3B82F6',
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
