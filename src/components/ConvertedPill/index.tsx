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
  fixedWidth?: number;
  fixedHeight?: number;
  fullBleed?: boolean;
};


const useStyles = makeStyles(t =>
  StyleSheet.create({
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20, // smoother & more pill-like
      backgroundColor:
        t.scheme === 'dark'
          ? alpha(t.colors.card, 0.92)
          : alpha('#FFFFFF', 0.96),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',

      // subtle floating effect
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 3
      },
      elevation: 3,
    },
    number: {
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      color: t.colors.text,
    },
    unit: {
      marginLeft: 6,
      fontWeight: '600',
      color: alpha(t.colors.text, 0.55),
    },
  })
);

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
          borderRadius: 18,
          paddingVertical: 6,
          paddingHorizontal: 12,
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
