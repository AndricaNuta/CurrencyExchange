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

export const alpha = (hex: string, a: number) => {
  // hex like #RRGGBB
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [_, r, g, b] = m;
  return `rgba(${parseInt(r,16)}, ${parseInt(g,16)}, ${parseInt(b,16)}, ${a})`;
};

const spacing = (n: number) => n * 4;

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: '#F7F8FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111827',
    subtext: '#6B7280',
    muted: '#9CA3AF',
    border: '#ECEFF3',
    tint: '#2563EB',
    danger: '#EF4444',
    success: '#22C55E',
    sheetHandle: '#D1D5DB',
    icon: '#111827',
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
    bg: '#0B0F14',
    surface: '#111827',
    card: '#0F172A',
    text: '#F9FAFB',
    subtext: '#9CA3AF',
    muted: '#6B7280',
    border: '#1F2937',
    tint: '#60A5FA',
    danger: '#F87171',
    success: '#34D399',
    sheetHandle: '#374151',
    icon: '#F9FAFB',
    navBg: '#0B0F14',
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
