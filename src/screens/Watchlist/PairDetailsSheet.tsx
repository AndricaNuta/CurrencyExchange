// screens/Watchlist/PairDetailsSheet.tsx
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, UIManager } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useGetHistoryRangeQuery } from '../../services/currencyApi';
import { InteractiveSparkline } from './InteractiveSparkline';
import { SmartAlertInline } from './SmartAlertInline';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type PairDetailsSheetRef = {
  present: () => void;
  presentAlerts: () => void; // directly open & scroll to Alerts section
};

type Props = {
  base: string;
  quote: string;
  rate?: number | null;
};

const useStyles = makeStyles((t) => StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '800', fontSize: 16, color: t.colors.text, letterSpacing: 0.2 },
  subtitle: { color: t.colors.subtext, fontSize: 12 },
  rangeRow: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end' },
  chip: (active: boolean) => ({
    height: 28, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: active ? t.colors.tint : alpha(t.colors.border, 0.9),
    backgroundColor: active ? alpha(t.colors.tint, 0.14) : t.scheme==='dark' ? alpha('#fff',0.03) : alpha('#111827',0.02),
  }),
  chipTxt: (active: boolean) => ({ color: active ? t.colors.tint : t.colors.text, fontWeight: '700', fontSize: 12 }),
  card: {
    borderRadius: 16, borderWidth: 1, borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.colors.card, padding: 12, gap: 10,
  },
  axisRow: { width: 320, flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', marginTop: 6 },
  axisTxt: { color: t.colors.subtext, fontSize: 11 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    height: 26, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme==='dark' ? alpha('#fff',0.03) : alpha('#111827',0.02),
  },
  statTxt: { color: t.colors.text, fontWeight: '700', fontSize: 12 },
  sectionTitle: { fontWeight: '800', color: t.colors.text, marginBottom: 6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: alpha(t.colors.border, 0.85), marginVertical: 12 },
}));

export const PairDetailsSheet = forwardRef<PairDetailsSheetRef, Props>(({ base, quote, rate }, ref) => {
  const s = useStyles();
  const t = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const scrollRef = useRef<BottomSheetScrollView>(null as any);

  const [range, setRange] = useState<'1W' | '1M'>('1W');
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const end = iso(new Date());
  const start = (() => { const d = new Date(); d.setDate(d.getDate() - (range === '1W' ? 7 : 30)); return iso(d); })();

  const { data: history, isLoading } = useGetHistoryRangeQuery({ from: base, to: quote, start, end }, { skip: !base || !quote });

  const data = useMemo(() => history?.map(p => p.rate) ?? [], [history]);
  const labels = useMemo(() => history?.map(p => p.date) ?? [], [history]);

  const hi = data.length ? Math.max(...data) : null;
  const lo = data.length ? Math.min(...data) : null;
  const dayChangePct = data.length > 1 ? ((data[data.length - 1] - data[data.length - 2]) / data[data.length - 2]) * 100 : null;

  useImperativeHandle(ref, () => ({
    present: () => { modalRef.current?.present(); /* default on Trend */ },
    presentAlerts: () => {
      modalRef.current?.present();
      // scroll a bit further to Alerts section after a tick
      setTimeout(() => scrollRef.current?.scrollTo?.({ y: 600, animated: true }), 140);
    },
  }), []);

  const snapPoints = useMemo(() => ['48%', '90%'], []);

  return (
    <BottomSheetModal ref={modalRef} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetScrollView ref={scrollRef} contentContainerStyle={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>{base} → {quote}</Text>
            <Text style={s.subtitle}>Mid rate: {rate != null ? rate.toFixed(4) : '—'} {quote}</Text>
          </View>
          <View style={s.rangeRow}>
            {(['1W','1M'] as const).map(opt => {
              const active = range === opt;
              return (
                <Pressable key={opt} onPress={() => setRange(opt)} style={s.chip(active)} accessibilityLabel={`Range ${opt}`}>
                  <Text style={s.chipTxt(active)}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Trend</Text>
          {isLoading ? (
            <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={s.subtitle}>Loading…</Text>
            </View>
          ) : data.length ? (
            <>
              <InteractiveSparkline
                width={320}
                height={100}
                data={data}
                dates={labels}
                tint={t.colors.tint}
                smooth
                showFill
                showGlow
              />
              <View style={s.axisRow}>
                {labels.length ? [labels[0], labels[Math.floor(labels.length/2)], labels[labels.length-1]].map((d, i) => (
                  <Text key={i} style={s.axisTxt}>
                    {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                )) : null}
              </View>
              <View style={{ height: 8 }} />
              <View style={s.statsRow}>
                <View style={s.stat}><Text style={s.statTxt}>High: {hi ? hi.toFixed(4) : '—'}</Text></View>
                <View style={s.stat}><Text style={s.statTxt}>Low: {lo ? lo.toFixed(4) : '—'}</Text></View>
                <View style={s.stat}><Text style={s.statTxt}>{range==='1W'?'24h':'Last day'}: {dayChangePct!=null ? `${dayChangePct>=0?'+':''}${dayChangePct.toFixed(2)}%` : '—'}</Text></View>
              </View>
            </>
          ) : (
            <Text style={s.subtitle}>No recent data.</Text>
          )}
        </View>

        <View style={s.divider} />

        <View style={s.card}>
          <Text style={s.sectionTitle}>Alerts</Text>
          <SmartAlertInline base={base} quote={quote} pairId={`${base}-${quote}`} currentRate={rate ?? undefined} />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

PairDetailsSheet.displayName = 'PairDetailsSheet';
