import React, { useMemo, useRef, useState, useEffect } from 'react';
import {Image,
  Pressable,
  Text,
  TextInput,
  View,
  Platform,} from 'react-native';
import {useNavigation,
  useRoute,
  type RouteProp,} from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { RootStackParamList } from '../../navigation/RootStackParamList';
import type { Candidate } from '../../ocr/pickImageAndDetectPrices';
import { styles } from './styles';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import {swapCurrencies,
  setFromCurrency,} from '../../redux/slices/settingsSlice';
import { useGetPairRateQuery } from '../../services/currencyApi';

export default function ScanPreviewScreen() {
  const nav = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanPreview'>>();
  const {
    uri, candidates
  } = route.params;

  // global currency settings
  const from = useSelector((s: RootState) => s.settings.fromCurrency);
  const to = useSelector((s: RootState) => s.settings.toCurrency);
  const decimals = useSelector((s: RootState) => s.settings.decimals);
  const dispatch = useDispatch();

  // mini-converter local state
  const [miniAmt, setMiniAmt] = useState(() => {
    const first = candidates?.[0]?.value;
    return first != null ? String(first) : '';
  });

  // keep the mini amount in sync when a new image is opened
  useEffect(() => {
    const first = candidates?.[0]?.value;
    setMiniAmt(first != null ? String(first) : '');
  }, [candidates, uri]);

  // base rate for the current global from → to
  const {
    data: basePair
  } = useGetPairRateQuery({
    from,
    to
  });
  const baseRate = basePair?.rate ?? 0;

  const sheetRef = useRef<BottomSheet>(null);
  const snaps = useMemo(() => ['24%', '48%', '86%'], []);

  const miniAmtNum = Number(miniAmt.replace(',', '.')) || 0;
  const miniConverted = baseRate ? miniAmtNum * baseRate : 0;

  const onPickCandidate = (c: Candidate) => {
    setMiniAmt(c.value.toFixed(2));
    if (c.currency && c.currency !== from) {
      dispatch(setFromCurrency(c.currency));
    }
  };

  return (
    <View style={styles.root}>
      {/* full-screen image */}
      <Image source={{
        uri
      }} style={styles.img} resizeMode="contain" />

      {/* Close */}
      <Pressable style={styles.close} onPress={() => nav.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      {/* bottom sheet with mini converter + detected list */}
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snaps}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Mini converter row --- */}
          <View style={styles.miniRow}>
            <View style={styles.miniTop}>
              <Text style={styles.miniLabel}>Convert</Text>
              <Pressable
                onPress={() => dispatch(swapCurrencies())}
                style={styles.swapBtn}
              >
                <Text style={styles.swapTxt}>↕︎</Text>
              </Pressable>
            </View>

            <View style={styles.miniInputs}>
              <View style={styles.fromBox}>
                <Text style={styles.ccy}>{from}</Text>
                <TextInput
                  value={miniAmt}
                  onChangeText={setMiniAmt}
                  keyboardType={Platform.select({
                    ios: 'decimal-pad',
                    android: 'numeric',
                  })}
                  placeholder="0"
                  style={styles.miniInput}
                />
              </View>

              <Text style={styles.arrow}>→</Text>

              <View style={styles.toBox}>
                <Text style={[styles.ccy, styles.toCcy]}>{to}</Text>
                <Text style={styles.miniConverted}>
                  {baseRate
                    ? new Intl.NumberFormat(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    }).format(miniConverted)
                    : '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.rateNote}>
              Rate:{' '}
              {baseRate
                ? new Intl.NumberFormat(undefined, {
                  maximumFractionDigits: 4,
                }).format(baseRate)
                : '—'}{' '}
              {to}
            </Text>
          </View>

          {/* --- Detected prices list (already converted) --- */}
          <Text style={styles.title}>Detected prices</Text>
          {candidates?.length ? (
            candidates.map((c, i) => (
              <Pressable
                key={`${c.value}-${c.currency ?? 'UNK'}-${i}`}
                onPress={() => onPickCandidate(c)}
                style={styles.row}
              >
                <View style={{
                  flex: 1
                }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {c.label || 'Item'}
                  </Text>
                  <Text style={styles.itemSub}>
                    {/* show original price exactly as found */}
                    {c.currency ? `${c.currency} ` : ''}
                    {c.value.toFixed(2)}
                  </Text>
                </View>

                <ConvertedPill
                  amount={c.value}
                  fromCurrency={c.currency ?? from}
                  toCurrency={to}
                  decimals={decimals}
                />
              </Pressable>
            ))
          ) : (
            <Text style={styles.meta}>No values detected.</Text>
          )}

          <Text style={styles.hint}>
            Tap a value to load it into the converter above.
          </Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function ConvertedPill({
  amount,
  fromCurrency,
  toCurrency,
  decimals,
}: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
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
    <View style={styles.convPill}>
      <Text style={styles.convMain}>
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
