import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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

export default function CurrencyPill({
  code,
  onPress,
}: {
  code: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={S.pill}>
      <Text style={S.flag}>{flags[code] ?? '🌐'}</Text>
      <Text style={S.code}>{code}</Text>
      <Text style={S.chev}>▾</Text>
    </Pressable>
  );
}
const S = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F7',
    borderRadius: 22,
    height: 36,
    paddingHorizontal: 12,
  },
  flag: {
    fontSize: 16
  },
  code: {
    fontSize: 14,
    fontWeight: '700'
  },
  chev: {
    color: '#6A6F7A'
  },
});
