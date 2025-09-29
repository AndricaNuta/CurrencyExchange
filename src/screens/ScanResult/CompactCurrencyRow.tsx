import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform, Animated, Easing } from 'react-native';
import { ChevronDown, RefreshCw } from 'react-native-feather';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useTranslation } from 'react-i18next';
import { SwapIcon } from '../../../assets/icons/svg';

type Props = {
  from: string; to: string; amount: string;
  onAmountChange: (v: string) => void;
  decimals: number; rate?: number; isFetching?: boolean; rateError?: boolean;
  onOpenFrom: () => void; onOpenTo: () => void; onSwap: () => void;
  renderFlag?: (code: string) => React.ReactNode;
};

const useStyles = makeStyles((t) => ({
  column: {
    width: '100%',

    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: t.spacing(3),
    overflow: 'hidden',
    marginBottom: 10,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    backgroundColor: t.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing(4),
    paddingVertical: t.spacing(3),
  },
  // two vertical stacks (left/right)
  col: {
    flex: 1,
    minWidth: 0
  },
  leftCol: {
    alignItems: 'flex-start'
  },
  rightCol: {
    alignItems: 'flex-end'
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.scheme === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#111827', 0.06),
    borderRadius: 18,
    height: 32,
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
  },
  pillCode: {
    fontSize: 13,
    fontWeight: '700',
    color: t.colors.text
  },

  input: {
    marginTop: t.spacing(1.5),
    width: '100%',
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 18,
    paddingHorizontal: 5,
    fontWeight: '700',
    color: t.colors.text,
  },

  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    flexShrink: 0,
    alignSelf: 'center',
    marginHorizontal: 8,
  },

  convertedWrap: {
    marginTop: t.spacing(1.5),
    minWidth: 0,
    paddingHorizontal: 5,
    maxWidth: '100%',
    alignItems: 'flex-end',
  },
  converted: {
    fontSize: 18,
    fontWeight: '800',
    color: t.colors.text
  },
  sub: {
    fontSize: 12,
    color: t.colors.subtext,
    left:10,
  },
  error: {
    fontSize: 12,
    color: t.colors.danger,
    marginTop: 6
  },
}));


export const CurrencySwapRow: React.FC<Props> = ({
  from, to, amount, onAmountChange, decimals, rate, isFetching, rateError,
  onOpenFrom, onOpenTo, onSwap, renderFlag,
}) => {
  const s = useStyles();
  const tkn = useTheme();
  const {
    t
  } = useTranslation();
  const amtNum = Number(amount.replace(',', '.')) || 0;
  const convertedNum = (rate ?? 0) * amtNum;

  const convertedStr = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(convertedNum),
    [convertedNum, decimals]
  );

  // --- Swap animation ---
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [animating, setAnimating] = useState(false);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleSwapPress = () => {
    if (animating) return;
    setAnimating(true);

    spin.setValue(0);
    pulse.setValue(1);

    // fire onSwap halfway through spin
    const midway = setTimeout(() => onSwap(), 180);

    Animated.parallel([
      Animated.timing(spin, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
      ]),
    ]).start(() => {
      clearTimeout(midway);
      setAnimating(false);
    });
  };

  return (
    <View style={s.column}>
      <View style={s.row}>
        {/* LEFT column: FROM + amount */}
        <View style={[s.col, s.leftCol]}>
          <Pressable onPress={onOpenFrom} hitSlop={12} style={s.pill} accessibilityRole="button" accessibilityLabel="Change from currency">
            <View>
              {renderFlag ? renderFlag(from)
                : <Text style={s.pillCode}>
                  {from}
                </Text>}
            </View>
            <Text style={s.pillCode} numberOfLines={1} ellipsizeMode="tail">{from}</Text>
            <ChevronDown
              width={18}
              height={18}
              strokeWidth={2.25}
              color={tkn.colors.iconMuted} />
          </Pressable>

          <TextInput
            value={amount}
            onChangeText={onAmountChange}
            keyboardType={Platform.select({
              ios: 'decimal-pad',
              android: 'numeric'
            })}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            style={s.input}
            multiline={false}
          />
        </View>

        {/* SWAP in the middle */}
        <Pressable
          onPress={handleSwapPress}
          style={s.swapBtn}
          hitSlop={8}
          accessibilityLabel="Swap currencies"
          accessibilityRole="button"
          disabled={animating}
        >
          <Animated.View style={{
            transform: [{
              rotate: rotation
            }, {
              scale: pulse
            }]
          }}>
            <SwapIcon width={25} height={25} />
          </Animated.View>
        </Pressable>

        {/* RIGHT column: TO + converted */}
        <View style={[s.col, s.rightCol]}>
          <Pressable onPress={onOpenTo} hitSlop={12} style={s.pill} accessibilityRole="button" accessibilityLabel="Change to currency">
            <View>
              {renderFlag ? renderFlag(to) :
                <Text style={s.pillCode}>{to}</Text>}
            </View>
            <Text style={s.pillCode} numberOfLines={1} ellipsizeMode="tail">{to}</Text>
            <ChevronDown
              width={18}
              height={18}
              strokeWidth={2.25}
              color={tkn.colors.iconMuted} />
          </Pressable>

          <View style={s.convertedWrap}>
            {isFetching ? (
              <ActivityIndicator />
            ) : rateError ? (
              <Text style={s.error}>{t('converter.rateError')}</Text>
            ) : (
              <Text style={s.converted} numberOfLines={1} ellipsizeMode="tail">
                {convertedStr}
              </Text>
            )}
          </View>
        </View>
      </View>

      <Text style={s.sub} numberOfLines={1} ellipsizeMode="tail">
        {t('converter.rateLabel')}{' '}
        {rate
          ? new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 4
          }).format(rate)
          : '—'}{' '}
        {to}
      </Text>
    </View>
  );
};
