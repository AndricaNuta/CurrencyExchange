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

    iconDefault: string;
    iconMuted: string;
    iconActive: string;
    iconDanger: string;
    iconSuccess: string;
    iconWarning: string;           // NEW

    // icon backgrounds (badges / circular pills)
    iconBgDefault: string;
    iconBgMuted: string;
    iconBgAccent: string;
    iconBgDanger: string;
    iconBgSuccess: string;
    iconBgWarning: string;         // NEW

    // text/icon color ON those backgrounds (contrast)
    onIconBgDefault: string;
    onIconBgMuted: string;
    onIconBgAccent: string;
    onIconBgDanger: string;
    onIconBgSuccess: string;
    onIconBgWarning: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number };
  spacing: (n: number) => number;
  shadow: { ios: any; android: { elevation: number } };
  roles: {
    settings: {
      defaultFromIcon: { fg: keyof Theme['colors']; bg: keyof Theme['colors']; };
      defaultToIcon:   { fg: keyof Theme['colors']; bg: keyof Theme['colors']; };
      darkModeIcon:    { fg: keyof Theme['colors']; bg: keyof Theme['colors']; };
      notifIcon:       { fg: keyof Theme['colors']; bg: keyof Theme['colors']; };
    };
  };

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
const warningLight = '#EA580C';
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

    // icon strokes
    iconDefault: '#1B1B23',
    iconMuted: '#9CA3AF',
    iconActive: base.purple.primary,
    iconDanger: '#EF4444',
    iconSuccess: '#22C55E',
    iconWarning: warningLight,

    // backgrounds (tinted chips)
    iconBgDefault: '#F1F2F6',
    iconBgMuted: '#EEF1F7',
    iconBgAccent: '#EEEAFB',
    iconBgDanger: '#FDECEC',
    iconBgSuccess: '#EAF8F0',
    iconBgWarning: '#FFF2E8',

    // contrast on those bgs
    onIconBgDefault: '#1B1B23',
    onIconBgMuted: '#6F6B7E',
    onIconBgAccent: base.purple.primary,
    onIconBgDanger: '#B91C1C',
    onIconBgSuccess: '#166534',
    onIconBgWarning: '#9A3412',
  },
  roles: {
    settings: {
      defaultFromIcon: {
        fg: 'iconActive',
        bg: 'iconBgAccent'
      }, // purple accent
      defaultToIcon:   {
        fg: 'iconWarning',
        bg: 'iconBgWarning'
      }, // orange
      darkModeIcon:    {
        fg: 'iconDefault',
        bg: 'iconBgDefault'
      }, // neutral
      notifIcon:       {
        fg: 'iconDanger',
        bg: 'iconBgDanger'
      },  // red
    },
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
      }
    },
    android: {
      elevation: 2
    }
  },
};
const warningDark = '#F59E0B';

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

    iconDefault: '#F4F3F8',
    iconMuted: '#8A84A8',
    iconActive: base.purple.tonal,
    iconDanger: '#F87171',
    iconSuccess: '#34D399',
    iconWarning: warningDark,

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
  },
  roles: {
    settings: {
      defaultFromIcon: {
        fg: 'iconActive',
        bg: 'iconBgAccent'
      },
      defaultToIcon:   {
        fg: 'iconWarning',
        bg: 'iconBgWarning'
      },
      darkModeIcon:    {
        fg: 'iconDefault',
        bg: 'iconBgDefault'
      },
      notifIcon:       {
        fg: 'iconDanger',
        bg: 'iconBgDanger'
      },
    },
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
      }
    },
    android: {
      elevation: 0
    }
  },
};