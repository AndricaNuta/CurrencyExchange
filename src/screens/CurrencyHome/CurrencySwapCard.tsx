import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform, Animated, Easing, InteractionManager } from 'react-native';
import { ChevronDown, Star } from 'react-native-feather';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useTranslation } from 'react-i18next';
import { SwapIcon } from '../../../assets/icons/svg';
import {
  FirstTimeTipPressable,
  FirstTimeTipPressableHandle
} from '../../components/TipComponents/FirstTimeTipPressable';
import { AppTipContent } from '../../components/TipComponents/AppTipContent';
import { events, TOUR_STAR_TO_WATCHLIST_STEP2 } from '../onboarding/events';
import { delKey, getBool } from '../../services/mmkv';
import { consumeGuidedTourPending, OB_KEYS } from '../onboarding/onboardingKeys';
import { useFocusEffect } from '@react-navigation/native';

const useCardStyles = makeStyles((t) => ({
  card:{ backgroundColor:t.colors.card, borderRadius:t.radius.xl, ...t.shadow.ios, ...t.shadow.android },
  block:{ padding:t.spacing(5) },
  blockTop:{ borderTopLeftRadius:24, borderTopRightRadius:24 },
  blockBottom:{ borderBottomLeftRadius:24, borderBottomRightRadius:24, paddingTop:t.spacing(7) },
  blockHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  blockLabel:{ fontSize:t.typography.title.size, fontWeight:t.typography.title.weight as any, color:t.colors.subtext },
  bigInput:{ fontSize:t.typography.numStrongLarge, fontWeight:t.typography.numStrong as any, marginTop:8, paddingVertical:0, color:t.colors.text },
  bigConverted:{ fontSize:t.typography.numStrongLarge, fontWeight:t.typography.numStrong as any, marginTop:8, color:t.colors.text },
  subAmount:{ marginTop:6, color:t.colors.subtext, fontSize:14 },
  pill:{ flexDirection:'row', alignItems:'center', backgroundColor: t.scheme==='dark' ? alpha('#FFFFFF',0.08) : alpha('#111827',0.06),
         borderRadius:t.radius.pill, paddingHorizontal:14, height:36, gap:8 },
  pillFlag:{ fontSize:16 },
  pillCode:{ fontSize:14, fontWeight:'700', color:t.colors.text },
  swapCircle:{ position:'absolute', alignSelf:'center', top:'40%',
               backgroundColor:t.colors.surface, borderRadius:999, width:64, height:64,
               alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:t.colors.border,
               ...t.shadow.ios, ...t.shadow.android },
  error:{ color:t.colors.danger, marginTop:8 },
}));

type Props = {
  from: string; to: string; amount: string;
  onAmountChange: (v: string) => void;
  decimals: number; rate?: number; isFetching?: boolean; rateError?: boolean;
  onOpenFrom: () => void; onOpenTo: () => void; onSwap: () => void;
  renderFlag?: (code: string) => React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenAlerts: () => void;
  starTipExternalRef?: React.Ref<FirstTimeTipPressableHandle>; // 👈 NEW
  onStarAnchorReady?: () => void;
};

const fmt = (n: number, c: string, max = 2) => {
  try { return new Intl.NumberFormat(undefined,{ style:'currency', currency:c, maximumFractionDigits:max }).format(n); }
  catch { return `${n.toFixed(max)} ${c}`; }
};

export const CurrencySwapCard: React.FC<Props> = (props) => {
  const s = useCardStyles();
  const { t } = useTranslation();
  const {
    from, to, amount, onAmountChange, decimals, rate, isFetching, rateError,
    onOpenFrom, onOpenTo, onSwap, renderFlag, isFavorite, onToggleFavorite
  } = props;
  const tkn = useTheme();

  const amtNum = Number(amount.replace(',', '.')) || 0;
  const converted = (rate ?? 0) * amtNum;

  // --- Swap animation ---
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [animating, setAnimating] = useState(false);
  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
    return (instance: T) => {
      for (const r of refs) {
        if (!r) continue;
        if (typeof r === 'function') r(instance);
        else try { (r as any).current = instance; } catch {}
      }
    };
  }

  // 3) inside component:
  const starTipRef = useRef<FirstTimeTipPressableHandle>(null);
    const [starLaidOut, setStarLaidOut] = useState(false);
    const starTipHandle = useRef<FirstTimeTipPressableHandle>(null);
    const [starReady, setStarReady] = useState(false);
    const [wantOpen, setWantOpen] = useState(false);
    const openedRef = useRef(false);

    // If Settings queued the tour, request opening
    useEffect(() => {
      if (consumeGuidedTourPending()) setWantOpen(true);
    }, []);

    // Also respond to the event as a fallback
    useEffect(() => {
      const ask = () => setWantOpen(true);
      events.on('tour.runGuided', ask);
      return () => events.off('tour.runGuided', ask);
    }, []);
    // Open exactly once, after layout + interactions; retry a couple of times.
    useEffect(() => {
      if (!wantOpen || !starReady || openedRef.current) return;

      const run = () => {
        if (openedRef.current) return;
        openedRef.current = true;
        setWantOpen(false);

        // Try a few frames in case overlay measurement is late on some devices.
        const tries = [0, 120, 260];
        tries.forEach(ms => {
          setTimeout(() => {
            starTipHandle.current?.forceShowOnce();
            // uncomment to debug:
            // console.log('[tour] open try at', ms);
          }, ms);
        });
      };

      const task = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(run);
      });
      return () => task.cancel();
    }, [wantOpen, starReady]);
  const handleSwapPress = () => {
    if (animating) return;
    setAnimating(true);
    spin.setValue(0); pulse.setValue(1);
    const midway = setTimeout(() => { onSwap(); }, 200);
    Animated.parallel([
      Animated.timing(spin, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 120, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(() => { clearTimeout(midway); setAnimating(false); });
  };

  // ----- Tip refs & first-run orchestration -----
  const tipFromRef   = useRef<FirstTimeTipPressableHandle>(null);
  const tipAmountRef = useRef<FirstTimeTipPressableHandle>(null);
  const tipToRef     = useRef<FirstTimeTipPressableHandle>(null);
  useEffect(() => {
    // Kick off only if FROM hasn't been seen yet
    if (!getBool(OB_KEYS.TIP_FROM)) {
      const tmr = setTimeout(() => tipFromRef.current?.open(), 450);
      return () => clearTimeout(tmr);
    }
  }, []);

  // Amount focus helper
  const amountInputRef = useRef<TextInput>(null);
  const focusAmount = () => amountInputRef.current?.focus();

  return (
    <View style={s.card}>
      {/* TOP: FROM + AMOUNT */}
      <View style={[s.block, s.blockTop]}>
        <View style={s.blockHeader}>
          <Text style={s.blockLabel}>{t('converter.amount')}</Text>

          {/* FROM pill tip
          <FirstTimeTipPressable
            ref={tipFromRef}
            storageKey={OB_KEYS.TIP_FROM}
            placement="bottom"
            blockActionOnFirstPress
            onPress={onOpenFrom}
            content={({ close }) => (
              <AppTipContent
                title="Your base currency"
                text="Tap to choose the currency you convert from."
                primaryLabel="Next"
                onPrimaryPress={() => {
                  close();
                  requestAnimationFrame(() => tipAmountRef.current?.open());
                }}
                arrowPosition="bottom"
              />
            )}
          >*/}
            <Pressable
              style={s.pill}
              onPress={onOpenFrom}
              accessibilityRole="button"
              accessibilityLabel="Change from currency"
            >
              <Text style={s.pillFlag}>{renderFlag ? renderFlag(from) : from}</Text>
              <Text style={s.pillCode}>{from}</Text>
              <ChevronDown color={tkn.colors.iconMuted} width={18} height={18} strokeWidth={2.25} />
            </Pressable>
        </View>

        {/* AMOUNT tip (wrap TextInput in Pressable so first tap is intercepted)
        <FirstTimeTipPressable
          ref={tipAmountRef}
          storageKey={OB_KEYS.TIP_AMOUNT}
          placement="top"
          blockActionOnFirstPress
          onPress={focusAmount}
          content={({ close }) => (
            <AppTipContent
              title="Amount to convert"
              text="Type the value you want to convert."
              primaryLabel="Next"
              onPrimaryPress={() => {
                close();
                requestAnimationFrame(() => tipToRef.current?.open());
              }}
              arrowPosition="top"
            />
          )}
        >*/}
          <Pressable onPress={focusAmount} accessibilityRole="button" accessibilityLabel="Edit amount">
            <TextInput
              ref={amountInputRef}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
              placeholder="0"
              style={s.bigInput}
              placeholderTextColor="#9CA3AF"
            />
          </Pressable>

        <Text style={s.subAmount}>{fmt(amtNum, from, decimals)}</Text>
      </View>

      {/* SWAP */}
      <Pressable
        onPress={handleSwapPress}
        style={s.swapCircle}
        accessibilityRole="button"
        accessibilityLabel="Swap currencies"
        disabled={animating}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }, { scale: pulse }] }}>
          <SwapIcon width={40} height={40} fill={tkn.colors.iconActive}/>
        </Animated.View>
      </Pressable>

      {/* BOTTOM: TO + RESULT + STAR tip (kept) */}
      <View style={[s.block, s.blockBottom]}>
        <View style={s.blockHeader}>
          <Text style={s.blockLabel}>{t('converter.convertedTo')}</Text>

          {/* TO pill tip
          <FirstTimeTipPressable
            ref={tipToRef}
            storageKey={OB_KEYS.TIP_TO}
            placement="bottom"
            blockActionOnFirstPress
            onPress={onOpenTo}
            content={({ close }) => (
              <AppTipContent
                title="Target currency"
                text="Choose where you want prices converted to."
                primaryLabel="Done"
                onPrimaryPress={close}
                arrowPosition="bottom"
              />
            )}
          >*/}
            <Pressable
              style={s.pill}
              onPress={onOpenTo}
              accessibilityRole="button"
              accessibilityLabel="Change to currency"
            >
              <Text style={s.pillFlag}>{renderFlag ? renderFlag(to) : to}</Text>
              <Text style={s.pillCode}>{to}</Text>
              <ChevronDown color={tkn.colors.iconMuted} width={18} height={18} strokeWidth={2.25} />
            </Pressable>
        </View>

        {isFetching ? (
          <ActivityIndicator />
        ) : rateError ? (
          <Text style={s.error}>{t('converter.couldNotFetchRate')}</Text>
        ) : (
          <>
            <Text style={s.bigConverted}>
              {new Intl.NumberFormat(undefined,{ minimumFractionDigits:decimals, maximumFractionDigits:decimals }).format(converted)}
            </Text>
            <Text style={s.subAmount}>{fmt(converted, to, decimals)}</Text>
          </>
        )}

        <View style={{flexDirection:'row', gap:10, alignSelf:'flex-end'}}>
          <FirstTimeTipPressable
            ref={mergeRefs(starTipRef, props.starTipExternalRef)}
            storageKey={OB_KEYS.STAR_TIP}
            onPress={onToggleFavorite}
            placement="top"
            content={({ close }) => (
              <AppTipContent
              title="Save this rate"
              text="Tap ★ to add this rate to your Watchlist. Set alerts next."
              primaryLabel="Open Watchlist"
                onPrimaryPress={() => {
                  onToggleFavorite();
                  close();
                  requestAnimationFrame(() => {
                    events.emit('tour.starToWatchlist.step2');
                  });
                }}
              />
            )}
          >
            <Pressable  onLayout={props.onStarAnchorReady}  hitSlop={8} accessibilityLabel="Toggle favorite">
              <Star
                width={24}
                height={24}
                color={isFavorite ? tkn.colors.iconActive : tkn.colors.iconMuted}
                fill={isFavorite ? tkn.colors.iconActive : 'transparent'}
              />
            </Pressable>
          </FirstTimeTipPressable>
        </View>
      </View>
    </View>
  );
};
