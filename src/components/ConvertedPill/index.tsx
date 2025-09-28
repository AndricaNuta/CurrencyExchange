import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useGetPairRateQuery } from '../../services/currencyApi';

type Props = {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
  containerStyle?: any;
  textStyle?: any;
  muteUnit?: boolean;
  variant?: 'default' | 'overlay';
  fixedWidth?: number;     // exact width
  fixedHeight?: number;    // exact height
  fullBleed?: boolean;
};

const useStyles = makeStyles(t => StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: t.scheme === 'dark'
      ? alpha('#FFFFFF', 0.08)
      : alpha('#111827', 0.06),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    maxWidth: '100%',
  },
  number: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: t.colors.text,
  },
  unit: {
    marginLeft: 5,
    fontWeight: '600',
    color: alpha(t.colors.text, 0.55),
  },
}));

export function ConvertedPill({
  amount, fromCurrency, toCurrency, decimals,
  containerStyle, textStyle, muteUnit = true, variant = 'default',
  fixedWidth, fixedHeight,
}: Props) {
  const s = useStyles();
  const numSize = textStyle?.fontSize ?? (variant === 'overlay' ? 13 : 14);
  const unitSize = Math.round(numSize * 0.8);

  const {
    data
  } = useGetPairRateQuery({
    from: fromCurrency,
    to: toCurrency
  });
  const rate = data?.rate ?? 0;
  const converted = rate ? amount * rate : 0;
  return (
    <View
      style={[
        s.pill,
        variant === 'overlay' && {
          borderRadius: 8
        },
        fixedWidth  != null && {
          width: Math.round(fixedWidth)
        },
        fixedHeight != null && {
          height: Math.round(fixedHeight)
        },
        containerStyle,
      ]}
    >
      <Text style={[s.number, {
        fontSize: numSize
      }]}>
        {converted.toFixed(decimals)}
      </Text>
      <Text
        style={[
          s.unit,
          {
            fontSize: unitSize,
            opacity: muteUnit ? 0.6 : 1
          },
        ]}
        numberOfLines={1}
      >
        {toCurrency.toUpperCase()}
      </Text>
    </View>
  );
}
