import { Colors } from '@/constants/theme';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colorScheme: 'light' | 'dark';
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('system');
  const systemScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  const colorScheme = theme === 'system' ? systemScheme : theme;
  const colors = Colors[colorScheme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
