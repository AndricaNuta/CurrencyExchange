import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {View,
  Text,
  Pressable,
  ActivityIndicator,} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setFromCurrency, setToCurrency, swapCurrencies } from '../../redux/slices/settingsSlice';
import { addHistory } from '../../redux/slices/historySlice';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';
import { useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import { styles, previewStyles } from './styles';
import { PickerBottomSheet } from '../../components/PickerBottomSheet'; // ⬅️ use the shared component
import { CurrencySwapCard } from './CurrencySwapCard';

/* ---------- helpers (unchanged) ---------- */
function useSortedCurrencyList(map?: Record<string, string>) {
  return useMemo(
    () =>
      map
        ? Object.entries(map)
          .map(([code, name]) => ({
            code,
            name
          }))
          .sort((a, b) => a.code.localeCompare(b.code))
        : [],
    [map],
  );
}
type Item = { code: string; name: string };
const currencyToFlag: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  RON: '🇷🇴',
  NOK: '🇳🇴',
  SEK: '🇸🇪',
  DKK: '🇩🇰',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  JPY: '🇯🇵',
  PLN: '🇵🇱',
  HUF: '🇭🇺',
  CZK: '🇨🇿',
  TRY: '🇹🇷',
  BGN: '🇧🇬',
  AED: '🇦🇪',
  SAR: '🇸🇦',
  INR: '🇮🇳',
  ILS: '🇮🇱',
};
const flag = (code: string) => currencyToFlag[code] ?? '🌐';
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
const nowDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}/${d.getFullYear()}`;
};

/* ---------- OCR helpers (unchanged) ---------- */
type Candidate = { raw: string; value: number; currency?: string; line?: string; score: number };
// ... (keep your parseFlexibleAmount, detectPriceCandidates, etc.)

export default function CurrencyConverterScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  // Redux settings
  const from = useSelector((s: RootState) => s.settings.fromCurrency);
  const to = useSelector((s: RootState) => s.settings.toCurrency);
  const decimals = useSelector((s: RootState) => s.settings.decimals);
  const history = useSelector((s: RootState) => s.history.items);
  const dispatch = useDispatch();

  // Data
  const {
    data: currencies, isLoading, error
  } = useGetCurrenciesQuery();
  const list = useSortedCurrencyList(currencies);
  const {
    data: pair, isFetching, error: rateError
  } = useGetPairRateQuery(
    {
      from,
      to
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true
    },
  );

  // Local UI
  const [amount, setAmount] = useState('1000');

  // ⬇️ NEW: BottomSheet refs + search state
  const fromSheetRef = useRef<BottomSheetModal>(null);
  const toSheetRef = useRef<BottomSheetModal>(null);
  const [fromQ, setFromQ] = useState('');
  const [toQ, setToQ] = useState('');

  const filterByQuery = useCallback(
    (q: string) => (i: Item) =>
      !q ||
      i.code.toLowerCase().includes(q.toLowerCase()) ||
      i.name.toLowerCase().includes(q.toLowerCase()),
    [],
  );

  // Map currencies to PickerBottomSheet items (with flag on the left)
  const fromSheetItems = useMemo(
    () =>
      list
        .filter(filterByQuery(fromQ))
        .map(({
          code, name
        }) => ({
          key: code,
          label: `${code} — ${name}`,
          left: <Text>{flag(code)}</Text>,
        })),
    [list, fromQ, filterByQuery],
  );

  const toSheetItems = useMemo(
    () =>
      list
        .filter(filterByQuery(toQ))
        .map(({
          code, name
        }) => ({
          key: code,
          label: `${code} — ${name}`,
          left: <Text>{flag(code)}</Text>,
        })),
    [list, toQ, filterByQuery],
  );

  // Preset from History
  useEffect(() => {
    const p = route?.params?.preset as
    { from: string; to: string; amount: number };
    if (p) {
      dispatch(setFromCurrency(p.from));
      dispatch(setToCurrency(p.to));
      setAmount(String(p.amount));
    }
  }, [route?.params?.preset, dispatch]);

  // Conversions
  const rate = pair?.rate ?? 0;

  // OCR state (unchanged)
  const [picking, setPicking] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pickErr, setPickErr] = useState<string | null>(null);

  const onPickImage = useCallback(async () => {
    try {
      setPickErr(null);
      setPicking(true);
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1
      });
      const asset = res?.assets?.[0];
      if (!asset?.uri) {
        setPicking(false);
        return;
      }
      const lines = await TextRecognition.recognize(asset.uri);
      // @ts-expect-error keep your detectPriceCandidates implementation
      const cands = detectPriceCandidates(
        (lines ?? []).map((l: string) => l.replace(/\s+/g, ' ').trim()).filter(Boolean),
      );
      setCandidates(cands.slice(0, 8));
    } catch (e: any) {
      setPickErr(String(e?.message ?? e));
    } finally {
      setPicking(false);
    }
  }, []);

  const applyCandidate = useCallback(
    (c: Candidate) => {
      setAmount(String(c.value));
      if (c.currency && c.currency !== from)
        dispatch(setFromCurrency(c.currency));
      if (rate) {
        dispatch(
          addHistory({
            source: 'gallery',
            from: c.currency ?? from,
            to,
            amount: c.value,
            converted: c.value * rate,
            rate,
          }),
        );
      }
    },
    [dispatch, from, to, rate],
  );

  const swap = () => dispatch(swapCurrencies());

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.dim}>Loading currencies…</Text>
      </View>
    );
  }
  if (error || !list.length) {
    return (
      <View style={styles.center}>
        <Text>Couldn’t load currencies.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Card */}
      <CurrencySwapCard
        from={from}
        to={to}
        amount={amount}
        onAmountChange={setAmount}
        decimals={decimals}
        rate={rate}
        isFetching={isFetching}
        rateError={!!rateError}
        onOpenFrom={() => fromSheetRef.current?.present()}
        onOpenTo={() => toSheetRef.current?.present()}
        onSwap={swap}
        renderFlag={(code) => <Text>{flag(code)}</Text>}
      />

      {/* Mid-market row */}
      <View style={styles.rateRow}>
        <Text style={styles.rateText}>
          Mid-market rate <Text style={styles.rateStrong}>
            {rate ? new Intl.NumberFormat(undefined, {
              maximumFractionDigits: 2
            }).format(rate) : '—'}
          </Text>{' '}
          {to}
        </Text>
        <View style={styles.timePill}>
          <Text style={styles.timeTxt}>{nowDate()}</Text>
        </View>
      </View>

      {/* Recent preview */}
      {!!history.length && (
        <View style={previewStyles.wrap}>
          <View style={previewStyles.header}>
            <Text style={previewStyles.title}>Recent</Text>
            <Pressable onPress={() => nav.navigate('History')}>
              <Text style={previewStyles.link}>View all</Text>
            </Pressable>
          </View>
          {history.slice(0, 5).map(h => (
            <Pressable
              key={h.id}
              style={previewStyles.row}
              onPress={() => {
                dispatch(setFromCurrency(h.from));
                dispatch(setToCurrency(h.to));
                setAmount(String(h.amount));
              }}
            >
              <Text style={previewStyles.main}>
                {h.amount.toFixed(2)} {h.from} → {h.converted.toFixed(2)} {h.to}
              </Text>
              <Text style={previewStyles.meta}>
                {new Date(h.when).toLocaleString()} • {h.rate.toFixed(4)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Upload → OCR */}
      <Pressable
        onPress={onPickImage}
        style={styles.pickBtn}
        disabled={picking}>
        {picking ?
          <ActivityIndicator />
          :
          <Text style={styles.pickTxt}>
          📷 Add image
          </Text>}
      </Pressable>
      {!!pickErr && <Text style={styles.err}>{pickErr}</Text>}

      {!!candidates.length && (
        <View style={styles.detectCard}>
          <Text style={styles.subTitle}>Detected prices</Text>
          {candidates.map((c, i) => (
            <Pressable key={`${c.value}-${c.currency ?? 'UNK'}-${i}`} onPress={() => applyCandidate(c)} style={styles.candRow}>
              <Text style={styles.candMain}>{c.currency ? `${c.currency} ` : ''}{c.value.toFixed(2)}</Text>
              {!!c.line &&
              <Text style={styles.candLine} numberOfLines={1}>
                {c.line}
              </Text>}
            </Pressable>
          ))}
          <Text style={styles.hint}>Tap a value to fill the converter.</Text>
        </View>
      )}

      <PickerBottomSheet
        ref={fromSheetRef}
        title="Choose currency"
        items={fromSheetItems}
        search={{
          value: fromQ,
          set: setFromQ
        }}
        onSelect={(code) => {
          dispatch(setFromCurrency(code));
          fromSheetRef.current?.dismiss();
        }}
      />

      <PickerBottomSheet
        ref={toSheetRef}
        title="Converted to"
        items={toSheetItems}
        search={{
          value: toQ,
          set: setToQ
        }}
        onSelect={(code) => {
          dispatch(setToCurrency(code));
          toSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}
