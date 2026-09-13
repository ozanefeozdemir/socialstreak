import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

const lightColors = {
  background: '#F2F0FF',
  card: '#FFFFFF',
  text: '#2D2D3A',
  textSecondary: '#8B8BA0',
  border: '#F0EDFF',
  primary: '#6C5CE7',
};

const darkColors = {
  background: '#12121A',
  card: '#1C1C28',
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  border: '#2C2C3A',
  primary: '#8273F0',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeState(storedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    })();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
