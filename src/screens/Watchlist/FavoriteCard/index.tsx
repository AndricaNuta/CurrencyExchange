import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, UIManager, StyleSheet, Animated, Easing, LayoutAnimation } from 'react-native';
import { Star, Bell, ChevronDown } from 'react-native-feather';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { useGetPairRateQuery, useGetHistoryRangeQuery } from '../../../services/currencyApi';
import { toggleFavorite } from '../../../redux/slices/favoritesSlice';
import { makeStyles, useTheme } from '../../../theme/ThemeProvider';
import { alpha } from '../../../theme/tokens';
import { InteractiveSparkline } from '../InteractiveSparkline';
import AlertsCenterModal from '../AlertsCenterModal';
import { currencyFlag } from '../../../utils/currencyFlag';
import { useStyles } from './styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
export type FavoriteCardHandle = {
  openAlerts: () => void;
};

type Props = {
  base: string;
  quote: string;
  onHeightChange?: (h: number) => void;
  onExpandedChange?: (expanded: boolean) => void;
};

const MIN_H = 48;
const MAX_H = 110;

const FavoriteCard = forwardRef<FavoriteCardHandle, Props>(function FavoriteCard(
  { base, quote, onHeightChange, onExpandedChange }, ref
) {
  const s = useStyles();
  const t = useTheme();
  const dispatch = useDispatch();

  const pairId = `${base}-${quote}`;
  const fav = useSelector((st: RootState) => st.favorites.items[pairId]);
  const alertsOn = !!fav?.alerts && (fav.alerts.onChangePct != null || fav.alerts.above != null || fav.alerts.below != null);

  const { data, isFetching } = useGetPairRateQuery({ from: base, to: quote }, { refetchOnFocus: true, refetchOnReconnect: true });
  const rate = data?.rate ?? null;

  // expand anim
  const [expanded, setExpanded] = useState(false);
  const aHeight = useRef(new Animated.Value(MIN_H)).current;
  const aUI = useRef(new Animated.Value(0)).current;
  const chevronRotate = aUI.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const toggleExpand = () => {
    const open = !expanded;
    setExpanded(open);
    onExpandedChange?.(open);
    Animated.parallel([
      Animated.timing(aHeight, {
        toValue: open ? MAX_H : MIN_H,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(aUI, {
        toValue: open ? 1 : 0,
        duration: open ? 220 : 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };
  useImperativeHandle(ref, () => ({
    openAlerts: () => setShowModal(true),
  }), []);
  const [range, setRange] = useState<'1W' | '1M'>('1W');
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const end = iso(new Date());
  const start = (() => { const d = new Date(); d.setDate(d.getDate() - (range === '1W' ? 7 : 30)); return iso(d); })();
  const { data: history, isLoading: histLoading } = useGetHistoryRangeQuery({ from: base, to: quote, start, end }, { skip: !base || !quote });
  const spark = (history ?? []).map(p => p.rate);
  const labels = (history ?? []).map(p => p.date);

  const hi = spark.length ? Math.max(...spark) : rate ?? null;
  const lo = spark.length ? Math.min(...spark) : rate ?? null;
  const dayChangePct = spark.length > 1 ? ((spark[spark.length - 1] - spark[spark.length - 2]) / spark[spark.length - 2]) * 100 : null;
  const preview = useMemo(() => (rate ? `1 ${base} → ${rate.toFixed(4)} ${quote}` : '—'), [rate, base, quote]);

  const [showModal, setShowModal] = useState(false);
  const [hover, setHover] = useState<{ i: number; v: number; d?: string; px: number; py: number } | null>(null);
  const [chartW, setChartW] = useState(0);

  return (
       <View
         style={s.card}
          onLayout={e => onHeightChange?.(e.nativeEvent.layout.height)}  // ✅ report live height
        >
      {/* header press toggles expand */}
      <Pressable onPress={toggleExpand} accessibilityRole="button">
        <View style={s.topRow}>
          <View style={s.pairPill}>
            <Text style={s.flagBig}>{currencyFlag(base)}</Text>
            <Text style={s.codeTxt}>{base}</Text>
            <Text style={s.arrowTxt}>→</Text>
            <Text style={s.flagBig}>{currencyFlag(quote)}</Text>
            <Text style={s.codeTxt}>{quote}</Text>

            <Animated.View style={{ marginLeft: 6, transform: [{ rotate: chevronRotate }] }}>
              <ChevronDown width={16} height={16} color={expanded ? t.colors.tint : t.colors.subtext} />
            </Animated.View>
          </View>

          <View style={s.rightActions}>
            <Pressable onPress={(e) => { e.stopPropagation(); setShowModal(true); }} style={[s.iconCircle, alertsOn && s.iconActive]} hitSlop={8}>
              <Bell width={18} height={18} color={alertsOn ? t.colors.tint : t.colors.subtext} />
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); dispatch(toggleFavorite({ base, quote })); }} style={s.iconCircle} hitSlop={8}>
              <Star width={20} height={20} color={'#f5b301'} fill={'#f5b301'} />
            </Pressable>
          </View>
        </View>

        <View style={s.rateBlock}>
          <Text style={s.rateStrong} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {isFetching || rate == null ? '—' : rate.toFixed(4)}
          </Text>
          <Text style={s.hint}>{preview}</Text>
        </View>
      </Pressable>

      <View style={s.chartSection}>
  <Animated.View
    onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
    style={[s.chartBox, { height: aHeight }]}   // <- layout-driven height
  >
    <View style={s.innerChart}>
      {(!spark.length || histLoading) ? (
        <View style={{ flex: 1 }} />
      ) : (
        <InteractiveSparkline
          data={spark}
          dates={labels}
          tint={t.colors.tint}
          smooth
          showFill
          showGlow
          paddingPct={0.12}
          interactive={expanded} // gestures only when expanded
          onPointHover={(i, v, d, px, py) => {
            if (i < 0 || !Number.isFinite(v)) setHover(null);
            else setHover({ i, v, d, px: px ?? 0, py: py ?? 0 });
          }}
        />
      )}
    </View>

          {hover && Number.isFinite(hover.v) && (
            <>
              <View pointerEvents="none" style={[s.hoverLine, { left: Math.max(0, hover.px - 0.5), backgroundColor: alpha(t.colors.text, 0.12) }]} />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: Math.max(8, Math.min(hover.px - 60, Math.max(60, chartW) - 120)),
                  top: Math.max(4, hover.py - 34),
                  paddingHorizontal: 10, height: 28, borderRadius: 999,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: t.colors.card, borderWidth: 1, borderColor: alpha(t.colors.border, 0.9),
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: '800', fontSize: 12 }}>
                  {hover.v.toFixed(4)} {quote}
                </Text>
                {!!hover.d && (
                  <Text style={{ color: t.colors.subtext, fontSize: 10 }}>
                    {new Date(hover.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
            </>
          )}

{expanded && (
      <Animated.View style={[s.rangeOverlay, { opacity: aUI }]} pointerEvents="box-none">
        {(['1W', '1M'] as const).map((opt) => {
          const active = range === opt;
          return (
            <Pressable
              key={opt}
              onPress={(e) => { e.stopPropagation(); setRange(opt); }}
              style={[s.rangeChip, active ? s.rangeChipActive : s.rangeChipInactive]}
              hitSlop={8}
              accessibilityLabel={`Range ${opt}`}
              pointerEvents="auto"
            >
              <Text style={[s.rangeTxt, active ? s.rangeTxtActive : s.rangeTxtInactive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    )}
  </Animated.View>

  {expanded && (
    <>
      <Animated.View style={[s.axisRow, { opacity: aUI }]}>
        {labels.length ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].map((ds, idx) => (
          <Text key={idx} style={s.axisTxt}>
            {new Date(ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        )) : null}
      </Animated.View>

            <View style={s.statsRow}>
              <View style={s.statPill}><Text style={s.statTxt}>High: {hi ? hi.toFixed(4) : '—'}</Text></View>
              <View style={s.statPill}><Text style={s.statTxt}>Low: {lo ? lo.toFixed(4) : '—'}</Text></View>
              <View style={s.statPill}>
                <Text style={s.statTxt}>
                  {range === '1W' ? '24h' : 'Last day'}: {dayChangePct != null ? `${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%` : '—'}
                </Text>
              </View>
            </View>

            <View style={s.row}>
              <View style={s.tinyCard}>
                <Text style={s.tinyLabel}>Buying</Text>
                <Text style={s.tinyValue}>{rate ? `${(rate * 1.0008).toFixed(5)} ${quote}` : '—'}</Text>
              </View>
              <View style={s.tinyCard}>
                <Text style={s.tinyLabel}>Selling</Text>
                <Text style={s.tinyValue}>{rate ? `${(rate * 0.9992).toFixed(5)} ${quote}` : '—'}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <AlertsCenterModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        base={base}
        quote={quote}
        currentRate={rate ?? undefined}
        hasAlerts={alertsOn}
        step={0.01}
        decimals={4}
      />
    </View>
  );
});
FavoriteCard.displayName = 'FavoriteCard';

export default FavoriteCard;