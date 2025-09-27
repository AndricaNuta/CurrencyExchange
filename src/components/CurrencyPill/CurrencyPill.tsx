import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

const flags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  NOK: '🇳🇴',
  RON: '🇷🇴',
  SEK: '🇸🇪',
  DKK: '🇩🇰',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  PLN: '🇵🇱',
  HUF: '🇭🇺',
  CZK: '🇨🇿',
  TRY: '🇹🇷',
  BGN: '🇧🇬',
  AED: '🇦🇪',
  SAR: '🇸🇦',
  INR: '🇮🇳',
  ILS: '🇮🇱',
};

const useStyles = makeStyles(t => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.scheme === 'dark'
      ? alpha('#FFFFFF', 0.08)
      : alpha('#111827', 0.06),
    borderRadius: 22,
    height: 36,
    paddingHorizontal: 12,
  },
  flag: {
    fontSize: 16
  },
  code: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.text
  },
  chev: {
    color: t.colors.subtext
  },
}));

export default function CurrencyPill({
  code,
  onPress,
}: { code: string; onPress: () => void; }) {
  const s = useStyles();
  return (
    <Pressable onPress={onPress} style={s.pill}>
      <Text style={s.flag}>{flags[code] ?? '🌐'}</Text>
      <Text style={s.code}>{code}</Text>
      <Text style={s.chev}>▾</Text>
    </Pressable>
  );
}
