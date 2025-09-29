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
    onTint: string;
    danger: string;
    success: string;
    sheetHandle: string;
    icon: string;
    navBg: string;

    iconDefault: string;
    iconMuted: string;
    iconActive: string;
    iconDanger: string;
    iconSuccess: string;
    iconWarning: string;

    iconBgDefault: string;
    iconBgMuted: string;
    iconBgAccent: string;
    iconBgDanger: string;
    iconBgSuccess: string;
    iconBgWarning: string;

    onIconBgDefault: string;
    onIconBgMuted: string;
    onIconBgAccent: string;
    onIconBgDanger: string;
    onIconBgSuccess: string;
    onIconBgWarning: string;

    highlightRing: string;
    highlightTint: string;
    highlightFill: string;
    highlightBorder: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number,
    sheet:number,
    pill:number };
  typography: typeof typography;
  spacing: (n: number) => number;
  shadow: { ios: any; android: { elevation: number } };
  roles: {
    settings: {
      defaultFromIcon: { fg: keyof Theme['colors']; bg: keyof Theme['colors'] };
      defaultToIcon:   { fg: keyof Theme['colors']; bg: keyof Theme['colors'] };
      darkModeIcon:    { fg: keyof Theme['colors']; bg: keyof Theme['colors'] };
      notifIcon:       { fg: keyof Theme['colors']; bg: keyof Theme['colors'] };
    };
  };
};


// theme/tokens.ts
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  sheet: 28,
  pill: 999,         // chips, buttons, pills
};

export const typography = {
  h1: {
    size: 22,
    weight: '700',
    lineHeight: 28
  },
  title: {
    size: 16,
    weight: '700',
    lineHeight: 22
  },
  body: {
    size: 15,
    weight: '400',
    lineHeight: 22.5
  },
  caption: {
    size: 12,
    weight: '700',
    lineHeight: 16,
    letterSpacing: 0.6,
    uppercase: true
  },
  numStrong: '800',
  numStrongLarge: 40,
};

export const shadow = {
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8
    },
  },
  android: {
    elevation: 6
  },
};

const spacing = (n: number) => n * 4;
export const base = {
  purple: {
    primary: '#483AA0',
    tonal: '#7965C1'
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#',''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
};
export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: '#F7F8FA',
    surface: '#FBFAFF',
    card: '#FFFFFF',
    text: '#14151A',
    subtext: '#4B5563',
    muted: '#6B7280',
    border: '#E2E8F0',
    tint: base.purple.primary,
    onTint: '#FFFFFF',
    danger: '#EF4444',
    success: '#22C55E',
    sheetHandle: '#D7D2EA',
    icon: '#1B1B23',
    navBg: '#FFFFFF',

    iconDefault: '#1B1B23',
    iconMuted: '#9CA3AF',
    iconActive: base.purple.primary,
    iconDanger: '#EF4444',
    iconSuccess: '#22C55E',
    iconWarning: '#EA580C',

    iconBgDefault: '#F1F2F6',
    iconBgMuted: '#EEF1F7',
    iconBgAccent: '#EEEAFB',
    iconBgDanger: '#FDECEC',
    iconBgSuccess: '#EAF8F0',
    iconBgWarning: '#FFF2E8',

    onIconBgDefault: '#1B1B23',
    onIconBgMuted: '#6F6B7E',
    onIconBgAccent: base.purple.primary,
    onIconBgDanger: '#7F1D1D',
    onIconBgSuccess: '#065F46',
    onIconBgWarning: '#7C2D12',

    // highlight
    highlightRing: '#0B0B0B',
    highlightTint: base.purple.primary,
    highlightFill: 'rgba(72,58,160,0.12)',
    highlightBorder: 'rgba(72,58,160,0.35)',
  },
  roles: {
    settings: {
      defaultFromIcon: {
        fg: 'iconActive',
        bg: 'iconBgAccent'
      },
      defaultToIcon: {
        fg: 'iconWarning',
        bg: 'iconBgWarning'
      },
      darkModeIcon: {
        fg: 'iconDefault',
        bg: 'iconBgDefault'
      },
      notifIcon: {
        fg: 'iconDanger',
        bg: 'iconBgDanger'
      },
    },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
    sheet: 28,
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
      }
    },
    android: {
      elevation: 2
    },
  },
  typography:   {
    h1: {
      size: 22,
      weight: '700',
      lineHeight: 28
    },
    title: {
      size: 16,
      weight: '700',
      lineHeight: 22
    },
    body: {
      size: 15,
      weight: '400',
      lineHeight: 22.5
    },
    caption: {
      size: 12,
      weight: '700',
      lineHeight: 16,
      letterSpacing: 0.6,
      uppercase: true
    },
    numStrong: '800',
    numStrongLarge: 40,
  }
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    bg: '#0F0E14',
    surface: '#161423',
    card: '#1C1930',
    text: '#F4F3F8',
    subtext: '#C7C2E4',
    muted: '#9A94BD',
    border: '#3A3553',
    tint: base.purple.tonal,
    onTint: '#FFFFFF',
    danger: '#F87171',
    success: '#34D399',
    sheetHandle: '#3A3553',
    icon: '#F4F3F8',
    navBg: '#0F0E14',

    iconDefault: '#F4F3F8',
    iconMuted: '#8A84A8',
    iconActive: base.purple.tonal,
    iconDanger: '#F87171',
    iconSuccess: '#34D399',
    iconWarning: '#F59E0B',

    iconBgDefault: '#242239',
    iconBgMuted: '#26223E',
    iconBgAccent: '#2A2650',
    iconBgDanger: '#3C2130',
    iconBgSuccess: '#1F3A2E',
    iconBgWarning: '#3F2A14',

    onIconBgDefault: '#F4F3F8',
    onIconBgMuted: '#B9B3D9',
    onIconBgAccent: base.purple.primary,
    onIconBgDanger: '#FCA5A5',
    onIconBgSuccess: '#86EFAC',
    onIconBgWarning: '#FCD34D',

    // highlight
    highlightRing: '#FFFFFF',
    highlightTint: base.purple.tonal,
    highlightFill: 'rgba(121,101,193,0.20)',
    highlightBorder: 'rgba(121,101,193,0.65)',
  },
  roles: {
    settings: {
      defaultFromIcon: {
        fg: 'iconActive',
        bg: 'iconBgAccent'
      },
      defaultToIcon: {
        fg: 'iconWarning',
        bg: 'iconBgWarning'
      },
      darkModeIcon: {
        fg: 'iconDefault',
        bg: 'iconBgDefault'
      },
      notifIcon: {
        fg: 'iconDanger',
        bg: 'iconBgDanger'
      },
    },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
    sheet: 28,
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
      }
    },
    android: {
      elevation: 0
    },
  },
  typography:   {
    h1: {
      size: 22,
      weight: '700',
      lineHeight: 28
    },
    title: {
      size: 16,
      weight: '700',
      lineHeight: 22
    },
    body: {
      size: 15,
      weight: '400',
      lineHeight: 22.5
    },
    caption: {
      size: 12,
      weight: '700',
      lineHeight: 16,
      letterSpacing: 0.6,
      uppercase: true
    },
    numStrong: '800',
    numStrongLarge: 40,
  }
};
