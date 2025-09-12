import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { styles } from './styles';
import {ArrowDown, ChevronDown, RefreshCw} from 'react-native-feather';

type Props = {
  from: string;
  to: string;
  amount: string;
  onAmountChange: (v: string) => void;
  decimals: number;
  rate?: number;
  isFetching?: boolean;
  rateError?: boolean;
  onOpenFrom: () => void;
  onOpenTo: () => void;
  onSwap: () => void;
  renderFlag?: (code: string) => React.ReactNode;
};

const fmt = (n: number, c: string, max = 2) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c,
      maximumFractionDigits: max,
    }).format(n);
  } catch {
    return `${n.toFixed(max)} ${c}`;
  }
};

export const CurrencySwapCard: React.FC<Props> = ({
  from,
  to,
  amount,
  onAmountChange,
  decimals,
  rate,
  isFetching,
  rateError,
  onOpenFrom,
  onOpenTo,
  onSwap,
  renderFlag,
}) => {
  const amtNum = Number(amount.replace(',', '.')) || 0;
  const converted = (rate ?? 0) * amtNum;

  return (
    <View style={styles.card}>
      {/* Top: Amount */}
      <View style={[styles.block, styles.blockTop]}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockLabel}>Amount</Text>
          <Pressable style={styles.pill} onPress={onOpenFrom}>
            <Text style={styles.pillFlag}>
              {renderFlag ? renderFlag(from) : from}
            </Text>
            <Text style={styles.pillCode}>{from}</Text>
            <ChevronDown/>
          </Pressable>
        </View>

        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
          placeholder="0"
          style={styles.bigInput}
        />
        <Text style={styles.subAmount}>{fmt(amtNum, from, decimals)}</Text>
      </View>

      {/* Swap */}
      <Pressable onPress={onSwap} style={styles.swapCircle}>
        <RefreshCw/>
      </Pressable>

      {/* Bottom: Converted */}
      <View style={[styles.block, styles.blockBottom]}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockLabel}>Converted to</Text>
          <Pressable style={styles.pill} onPress={onOpenTo}>
            <Text style={styles.pillFlag}>
              {renderFlag ? renderFlag(to) : to}
            </Text>
            <Text style={styles.pillCode}>{to}</Text>
            <ChevronDown/>
          </Pressable>
        </View>

        {isFetching ? (
          <ActivityIndicator />
        ) : rateError ? (
          <Text style={styles.error}>Couldn’t fetch rate.</Text>
        ) : (
          <>
            <Text style={styles.bigConverted}>
              {new Intl.NumberFormat(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }).format(converted)}
            </Text>
            <Text style={styles.subAmount}>{fmt(converted, to, decimals)}</Text>
          </>
        )}
      </View>
    </View>
  );
};
