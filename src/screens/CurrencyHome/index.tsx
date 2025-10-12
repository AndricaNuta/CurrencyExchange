import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Linking, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../redux/store';
import { useGetBaseTableQuery, useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import { useStyles } from './styles';
import { PickerBottomSheet } from '../../components/PickerBottomSheet';
import { CurrencySwapCard } from './CurrencySwapCard';
import { useSortedCurrencyList } from '../../utils/useSortedCurrencyList';
import { resetToDefaults, setFrom, setTo, swap } from '../../redux/slices/exchangeSlice';
import { currencyFlag } from '../../utils/currencyFlag';
import { filterByQuery } from '../../utils/filtersCurrency';
import { useCurrencyPicker } from '../../hooks/useCurrencyPicker';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../../hooks/useConnectivity';
import { useRatesStatus } from '../../hooks/useRatesStatus';
import { alpha } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { toggleFavorite, updateFavoriteRate } from '../../redux/slices/favoritesSlice';
import { Bell, Star } from 'react-native-feather';
import { FloatingGear, FloatingSettingsButton } from '../../components/FloatingSettingsButton';

const nowDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function CurrencyConverterScreen() {
  const styles = useStyles();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const {
    t
  } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<any>();
  const {
    from, to, initialized
  } = useSelector((s: RootState) => s.exchange);
  const {
    defaultFrom, defaultTo, decimals
  } = useSelector((s: RootState) => s.settings);
  useEffect(() => {
    if (!initialized) dispatch(resetToDefaults());
  }, [initialized, dispatch]);

  const effFrom = from ?? defaultFrom;
  const effTo   = to   ?? defaultTo;

  const {
    data: currencies, isLoading, error
  } = useGetCurrenciesQuery();
  const list = useSortedCurrencyList(currencies);
  useGetBaseTableQuery({
    base: effFrom
  }, {
    skip: !effFrom
  });
  const {
    online
  } = useConnectivity();
  const {
    hasBase, staleHours, lastDate
  } = useRatesStatus(effFrom);

  const isOffline = online === false;
  //const isStale = typeof staleHours === 'number' && staleHours > 24;
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

  const {
    modalRef,
    mode,
    presentMode,
    handleDismiss
  } = useCurrencyPicker();

  const fromSheetItems = useMemo(
    () => list
      .filter(filterByQuery(fromQ))
      .map(({
        code, name
      }) => ({
        key: code,
        label: `${code} — ${name}`,
        left: <Text>{currencyFlag(code)}</Text>,
      })),
    [list, fromQ]
  );

  const toSheetItems = useMemo(
    () => list
      .filter(filterByQuery(toQ))
      .map(({
        code, name
      }) => ({
        key: code,
        label: `${code} — ${name}`,
        left: <Text>{currencyFlag(code)}</Text>,
      })),
    [list, toQ]
  );


  useEffect(() => {
    const p = route?.params?.preset as {
      from: string;
      to: string;
      amount: number } | undefined;
    if (p) {
      dispatch(setFrom(p.from));
      dispatch(setTo(p.to));
      setAmount(String(p.amount));
    }
  }, [route?.params?.preset, dispatch]);

  const favItems = useSelector((s: RootState) => s.favorites.items);
  const isFav = !!favItems[`${effFrom}-${effTo}`];

  // NEW: popup ref + helpers
  const alertsRef = useRef<AlertsPopupRef>(null);
  const openAlerts = () => alertsRef.current?.open();
  const closeAlerts = () => alertsRef.current?.close();

  const onToggleFav = () => {
    // if not favorite yet -> add & open alerts popup
    if (!isFav) {
      dispatch(toggleFavorite({
        base: effFrom,
        quote: effTo
      }));
      setTimeout(openAlerts, 0);
    } else {
      dispatch(toggleFavorite({
        base: effFrom,
        quote: effTo
      }));
    }
  };
  useEffect(() => {
    if (isFav && pair?.rate && effFrom && effTo) {
      dispatch(updateFavoriteRate({
        base: effFrom,
        quote: effTo,
        rate: pair.rate
      }));
    }
  }, [isFav, pair?.rate, effFrom, effTo, dispatch]);
  const rate = pair?.rate ?? 0;

  const sheetTitle =
    mode === 'from' ? t('common.chooseCurrency') :
      mode === 'to'   ? t('converter.convertedTo') : '';
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
        <Text style={styles.dim}>{t('common.loadingCurrencies')}</Text>
      </View>
    );
  }
  if (error || !list.length) {
    return (
      <View style={styles.center}>
        <Text>{t('common.couldntLoadCurrencies')}</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <CurrencySwapCard
          from={effFrom}
          to={effTo}
          amount={amount}
          onAmountChange={setAmount}
          decimals={decimals}
          rate={rate}
          isFetching={isFetching}
          rateError={!!rateError}
          onOpenFrom={() => { Keyboard.dismiss(); presentMode('from')}}
          onOpenTo={() => {  Keyboard.dismiss(); presentMode('to')}}
          onSwap={() => dispatch(swap())}
          renderFlag={(code) => <Text>{currencyFlag(code)}</Text>}
          isFavorite={isFav}
          onToggleFavorite={onToggleFav}
          onOpenAlerts={openAlerts}
        />
        <FloatingSettingsButton onPress={() => nav.navigate('Settings')} bottomGuardPx={48}/>

        <View style={styles.rateRow}>
          <Text style={styles.rateText} onPress={() => { Linking.openURL('https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html') }}>
            {t('converter.midMarketRate')}{' '}
            <Text style={styles.rateStrong}>
              {rate ? new Intl.NumberFormat(undefined,{
                maximumFractionDigits: 2
              }).format(rate) : '—'}
            </Text>{' '}
            {effTo}
          </Text>

          <View style={{
            flexDirection:'row',
            alignItems:'center',
            gap:12
          }}>
            <View style={styles.timePill}>
              <Text style={styles.timeTxt}>{nowDate()}
              </Text>
            </View>
          </View>
        </View>
        <View style={{
          flexDirection: 'row',
          gap: 8
        }}>
          {isOffline && (
            <View style={{
              paddingHorizontal: 10,
              height: 24,
              borderRadius: 12,
              backgroundColor: alpha(theme.colors.danger, 0.12),
              justifyContent: 'center'
            }}>
              <Text style={{
                color: theme.colors.danger,
                fontSize: 12,
                fontWeight: '700'
              }}>
          Offline
              </Text>
            </View>
          )}
          {/*isStale && (
            <View style={{
              paddingHorizontal: 10,
              height: 24,
              borderRadius: 12,
              backgroundColor: alpha(theme.colors.muted, 0.15),
              justifyContent: 'center'
            }}>
              <Text style={{
                color: theme.colors.subtext,
                fontSize: 12,
                fontWeight: '700'
              }}>
          Stale • {Math.floor(staleHours!)}h
              </Text>
            </View>
          )
          <View style={styles.timePill}>
            <Text style={styles.timeTxt}>
              {lastDate ?? nowDate()}
            </Text>
          </View>*/}
        </View>
        {/* Recent preview
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
*/}

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
    </TouchableWithoutFeedback>
  );
}
