import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useGetPairRateQuery } from '../../services/currencyApi';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

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
    flex: 1,
  },
  main: {
    fontWeight: '700',
    color: t.colors.text,
  },
  meta: {
    fontSize: 10,
    color: t.colors.subtext,
    marginLeft: 3,
  },
}));

export function ConvertedPill(props: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
  containerStyle?: any;
  textStyle?: any;
}) {
  const {
    amount, fromCurrency, toCurrency, decimals, containerStyle, textStyle
  } = props;
  const s = useStyles();
  const {
    data
  } = useGetPairRateQuery({
    from: fromCurrency,
    to: toCurrency
  });
  const rate = data?.rate ?? 0;
  const converted = rate ? amount * rate : 0;

  return (
    <View style={[s.pill, containerStyle]}>
      <Text
        style={[s.main, textStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {rate
          ? new Intl.NumberFormat(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(converted)
          : '…'}
      </Text>
      <Text style={s.meta}>{toCurrency}</Text>
    </View>
  );
}
