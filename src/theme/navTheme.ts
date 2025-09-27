import { DefaultTheme, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
import type { Theme as AppTheme } from './tokens';

export const toNavTheme = (t: AppTheme): NavTheme => ({
  ...(t.scheme === 'dark' ? DarkTheme : DefaultTheme),
  colors: {
    ...(t.scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
    primary: t.colors.tint,
    background: t.colors.bg,
    card: t.colors.navBg,
    text: t.colors.text,
    border: t.colors.border,
    notification: t.colors.danger,
  },
});
