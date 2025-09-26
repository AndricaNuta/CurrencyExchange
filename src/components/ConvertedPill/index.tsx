import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGetPairRateQuery } from "../../services/currencyApi";

export function ConvertedPill({
  amount,
  fromCurrency,
  toCurrency,
  decimals,
  containerStyle,
  textStyle,
}: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
  containerStyle?: any;
  textStyle?: any;
}) {
  const {
    data
  } = useGetPairRateQuery({
    from: fromCurrency,
    to: toCurrency
  });
  const rate = data?.rate ?? 0;
  const converted = rate ? amount * rate : 0;

  return (
    <View style={[styles.convPill, containerStyle]}>
      <Text
        style={[styles.convMain, textStyle]}
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
      <Text style={styles.convMeta}>{toCurrency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  convMeta: {
    fontSize: 10,
    color: '#6A6F7A',
    left:3
  },
  convMain: {
    fontWeight: '700',
    color:'black'
  },
  convPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F7',
    alignItems: 'center',
    justifyContent:'center',
    flexDirection:'row',
    flex:1,
  },
});
