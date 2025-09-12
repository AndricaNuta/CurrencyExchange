import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../redux/store';
import { addHistory } from '../../redux/slices/historySlice';
import { useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import { styles, previewStyles } from './styles';
import { PickerBottomSheet } from '../../components/PickerBottomSheet';
import { CurrencySwapCard } from './CurrencySwapCard';
import { useSortedCurrencyList } from '../../utils/useSortedCurrencyList';
import { resetToDefaults, setFrom, setTo, swap } from '../../redux/slices/exchangeSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';

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

const nowDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

type Candidate = { raw: string; value: number; currency?: string; line?: string; score: number };

export default function CurrencyConverterScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  const {
    from, to, initialized
  } = useSelector((s: RootState) => s.exchange);
  const {
    defaultFrom, defaultTo, decimals
  } = useSelector((s: RootState) => s.settings);
  const history = useSelector((s: RootState) => s.history.items);

  useEffect(() => {
    if (!initialized) dispatch(resetToDefaults());
  }, [initialized, dispatch]);

  const effFrom = from ?? defaultFrom;
  const effTo   = to   ?? defaultTo;

  const {
    data: currencies, isLoading, error
  } = useGetCurrenciesQuery();
  const list = useSortedCurrencyList(currencies);

  const {
    data: pair, isFetching, error: rateError
  } = useGetPairRateQuery(
    {
      from: effFrom,
      to: effTo
    },
    {
      skip: !effFrom || !effTo,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [amount, setAmount] = useState('1000');
  const [fromQ, setFromQ] = useState('');
  const [toQ, setToQ]     = useState('');

  const filterByQuery = useCallback(
    (q: string) => (i: Item) =>
      !q ||
      i.code.toLowerCase().includes(q.toLowerCase()) ||
      i.name.toLowerCase().includes(q.toLowerCase()),
    []
  );

  const fromSheetItems = useMemo(
    () =>
      list.filter(filterByQuery(fromQ)).map(({
        code, name
      }) => ({
        key: code,
        label: `${code} — ${name}`,
        left: <Text>{flag(code)}</Text>,
      })),
    [list, fromQ, filterByQuery]
  );

  const toSheetItems = useMemo(
    () =>
      list.filter(filterByQuery(toQ)).map(({
        code, name
      }) => ({
        key: code,
        label: `${code} — ${name}`,
        left: <Text>{flag(code)}</Text>,
      })),
    [list, toQ, filterByQuery]
  );

  useEffect(() => {
    const p = route?.params?.preset as { from: string; to: string; amount: number } | undefined;
    if (p) {
      dispatch(setFrom(p.from));
      dispatch(setTo(p.to));
      setAmount(String(p.amount));
    }
  }, [route?.params?.preset, dispatch]);

  const rate = pair?.rate ?? 0;

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
      if (!asset?.uri) { setPicking(false); return; }
      const lines = await TextRecognition.recognize(asset.uri);
      // @ts-expect-error: use your own detectPriceCandidates
      const cands = detectPriceCandidates((lines ?? []).map((l: string) => l.replace(/\s+/g, ' ').trim()).filter(Boolean));
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
      if (c.currency && c.currency !== effFrom) dispatch(setFrom(c.currency));
      if (rate) {
        dispatch(addHistory({
          source: 'gallery',
          from: c.currency ?? effFrom,
          to: effTo,
          amount: c.value,
          converted: c.value * rate,
          rate,
        }));
      }
    },
    [dispatch, effFrom, effTo, rate]
  );
  type Mode = 'from' | 'to' | null;
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<Mode>(null);
  const isOpenRef = useRef(false);
  const pendingModeRef = useRef<Mode>(null);

  const presentMode = useCallback((next: Exclude<Mode, null>) => {
    if (!isOpenRef.current) {
      setMode(next);
      modalRef.current?.present();
      isOpenRef.current = true;
      return;
    }
    if (mode === next) {
      modalRef.current?.present();
      return;
    }
    pendingModeRef.current = next;
    modalRef.current?.dismiss();
  }, [mode]);

  const handleDismiss = useCallback(() => {
    isOpenRef.current = false;
    const next = pendingModeRef.current as Exclude<Mode, null> | null;
    if (next) {
      pendingModeRef.current = null;
      setMode(next);
      requestAnimationFrame(() => {
        modalRef.current?.present();
        isOpenRef.current = true;
      });
    } else {
      setMode(null);
    }
  }, []);

  const sheetTitle = mode === 'from' ? 'Choose currency' : mode === 'to' ? 'Converted to' : '';
  const sheetItems = mode === 'from' ? fromSheetItems : toSheetItems;
  const sheetSearch =
    mode === 'from'
      ? {
        value: fromQ,
        set: setFromQ
      }
      : mode === 'to'
        ? {
          value: toQ,
          set: setToQ
        }
        : undefined;

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
        from={effFrom}
        to={effTo}
        amount={amount}
        onAmountChange={setAmount}
        decimals={decimals}
        rate={rate}
        isFetching={isFetching}
        rateError={!!rateError}
        onOpenFrom={() => presentMode('from')}
        onOpenTo={() => presentMode('to')}
        onSwap={() => dispatch(swap())}
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
          {effTo}
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
                dispatch(setFrom(h.from));
                dispatch(setTo(h.to));
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
        disabled={picking}
      >
        {picking ?
          <ActivityIndicator />
          :
          <Text style={styles.pickTxt}>📷 Add image</Text>
        }
      </Pressable>
      {!!pickErr && <Text style={styles.err}>{pickErr}</Text>}

      {!!candidates.length && (
        <View style={styles.detectCard}>
          <Text style={styles.subTitle}>Detected prices</Text>
          {candidates.map((c, i) => (
            <Pressable key={`${c.value}-${c.currency ?? 'UNK'}-${i}`} onPress={() => applyCandidate(c)} style={styles.candRow}>
              <Text style={styles.candMain}>{c.currency ? `${c.currency} ` : ''}{c.value.toFixed(2)}</Text>
              {!!c.line
               &&
               <Text style={styles.candLine} numberOfLines={1}>{c.line}</Text>
              }
            </Pressable>
          ))}
          <Text style={styles.hint}>Tap a value to fill the converter.</Text>
        </View>
      )}

      <PickerBottomSheet
        ref={modalRef}
        title={sheetTitle}
        items={sheetItems}
        search={sheetSearch}
        initialIndex={0}
        onSelect={(code) => {
          if (mode === 'from') dispatch(setFrom(code));
          if (mode === 'to')   dispatch(setTo(code));
          modalRef.current?.dismiss();
        }}
        onDismiss={handleDismiss}
      />
    </View>
  );
}
