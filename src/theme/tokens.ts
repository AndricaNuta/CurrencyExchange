export type Scheme = 'light' | 'dark';

export type Theme = {
  scheme: Scheme;
  colors: {
    bg: string;
    surface: string;
    card: string;
    text: string;
    subtext: string;
    muted: string;
    border: string;
    tint: string;
    danger: string;
    success: string;
    sheetHandle: string;
    icon: string;
    navBg: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number };
  spacing: (n: number) => number;
  shadow: { ios: any; android: { elevation: number } };
};

export const base = {
  purple: {
    primary: '#483AA0',
    tonal:   '#7965C1',
  },
  accent: '#E3D095',
  white:  '#FFFFFF',
  black:  '#000000',
};

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
};

const spacing = (n: number) => n * 4;

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: '#F7F8FA',
    surface: '#FBFAFF',
    card: '#FFFFFF',
    text: '#1B1B23',
    subtext: '#6F6B7E',
    muted: '#9CA3AF',
    border: '#E7E3F4',
    tint: base.purple.primary,
    danger: '#EF4444',
    success: '#22C55E',
    sheetHandle: '#D7D2EA',
    icon: '#1B1B23',
    navBg: '#FFFFFF',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20
  },
  spacing,
  shadow: {
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4
      },
    },
    android: {
      elevation: 2
    },
  },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    bg: '#0F0E14',
    surface: '#161423',
    card: '#1C1930',
    text: '#F4F3F8',
    subtext: '#B9B3D9',
    muted: '#8A84A8',
    border: '#2B2743',
    tint: base.purple.primary,
    danger: '#F87171',
    success: '#34D399',
    sheetHandle: '#3A3553',
    icon: '#F4F3F8',
    navBg: '#0F0E14',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20
  },
  spacing,
  shadow: {
    ios: {
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: {
        width: 0,
        height: 0
      },
    },
    android: {
      elevation: 0
    },
  },
};
