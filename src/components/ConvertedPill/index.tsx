import React from 'react';
import { Text, View } from 'react-native';
import { useGetPairRateQuery } from '../../services/currencyApi';
import { useStyles } from './styles';

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

export function ConvertedPill({
  amount, fromCurrency, toCurrency, decimals,
  containerStyle, textStyle, muteUnit = true, variant = 'default',
  fixedWidth, fixedHeight,
}: Props) {
  const s = useStyles();
  const numSize = textStyle?.fontSize ?? (variant === 'overlay' ? 13 : 14);
  const unitSize = Math.round(numSize * 0.8);

  const pair =  useGetPairRateQuery({
    from: fromCurrency,
    to: toCurrency
  });
  if (!pair.data?.rate) return null;

  const rate = pair.data?.rate ?? 0;
  const converted = rate ? amount * rate : 0;
  return (
    <View
      style={[
        s.pill,
        variant === 'overlay' && s.pilloverlay,
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
