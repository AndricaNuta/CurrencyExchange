import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { darkTheme, lightTheme, type Theme } from './tokens';
import { StyleSheet } from 'react-native';

type Context = { theme: Theme };
const ThemeContext = createContext<Context>({
  theme: lightTheme
});

export function ThemeProvider({
  children
}: { children: React.ReactNode }) {
  const preference = useSelector((s: RootState) => s.settings.themePreference);
  const theme = useMemo(() => (preference === 'dark' ? darkTheme : lightTheme), [preference]);
  const value = useMemo(() => ({
    theme
  }), [theme]);
  return <ThemeContext.Provider value={value}>
    {children}
  </ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;

export function makeStyles<T extends StyleSheet.NamedStyles<T>>
(fn: (t: Theme) => T) {
  return () => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(fn(theme)), [theme]);
  };
}
