import React, { useMemo, useRef, useState, useEffect } from 'react';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View, Text, Pressable, TextInput, Platform, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { useGetPairRateQuery } from '../../services/currencyApi';
import { swap } from '../../redux/slices/exchangeSlice';
import { parsePrice } from '../../utils/parsePrice';
import {ConvertedPill} from '../../components/ConvertedPill';
import type { OCRResult } from '../../types/PriceOCR';
import { styles } from './styles';

export default function ScanSheet({
  ocr, onPickCandidate, initialAmountFromOCR,
  onIndexChange,
}: {
  ocr: OCRResult | null;
  initialAmountFromOCR?: number;
  onPickCandidate: (c: { raw: string; value: number; currency?: string; label?: string; lineIndex?: number; }) => void;
  onIndexChange?: (idx: number) => void;
}) {
  const from = useSelector((s: RootState) => s.exchange.from);
  const to = useSelector((s: RootState) => s.exchange.to);
  const decimals = useSelector((s: RootState) => s.settings.decimals);
  const dispatch = useDispatch();

  const [miniAmt, setMiniAmt] = useState(initialAmountFromOCR ? String(initialAmountFromOCR) : '');
  useEffect(() => {
    if (initialAmountFromOCR != null) setMiniAmt(String(initialAmountFromOCR));
  }, [initialAmountFromOCR]);

  const { data: basePair } = useGetPairRateQuery({ from, to });
  const baseRate = basePair?.rate ?? 0;
  const miniAmtNum = Number(miniAmt.replace(',', '.')) || 0;
  const miniConverted = baseRate ? miniAmtNum * baseRate : 0;

  const sheetRef = useRef<BottomSheet>(null);
  const snaps = useMemo(() => ['24%', '48%', '86%'], []);
  const screenH = Dimensions.get('window').height;
  const snapsPx = snaps.map(s => (typeof s === 'string' && s.endsWith('%') ? (parseFloat(s) / 100) * screenH : Number(s)));

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snaps}
      handleIndicatorStyle={styles.handle}
      onChange={onIndexChange}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        {/* Mini converter */}
        <View style={styles.miniRow}>
          <View style={styles.miniTop}>
            <Text style={styles.miniLabel}>Convert</Text>
            <Pressable onPress={() => dispatch(swap())} style={styles.swapBtn}>
              <Text style={styles.swapTxt}>↕︎</Text>
            </Pressable>
          </View>

          <View style={styles.miniInputs}>
            <View style={styles.fromBox}>
              <Text style={styles.ccy}>{from}</Text>
              <TextInput
                value={miniAmt}
                onChangeText={setMiniAmt}
                keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
                placeholder="0"
                style={styles.miniInput}
              />
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.toBox}>
              <Text style={[styles.ccy, styles.toCcy]}>{to}</Text>
              <Text style={styles.miniConverted}>
                {baseRate
                  ? new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(miniConverted)
                  : '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.rateNote}>
            Rate:{' '}
            {baseRate
              ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(baseRate)
              : '—'}{' '}
            {to}
          </Text>
        </View>

        {/* Detected prices */}
        <Text style={styles.title}>Detected prices</Text>
        {ocr?.prices?.length ? (
          ocr.prices.map((p, i) => {
            const { currency, value } = parsePrice(p.text, from);
            const title = (p as any).labelText || p.lineText || 'Item';
            return (
              <Pressable
                key={`${p.lineIndex}-${i}`}
                onPress={() => onPickCandidate({
                  raw: p.text,
                  value,
                  currency: (currency ?? from).toUpperCase(),
                  label: title,
                  lineIndex: p.lineIndex,
                })}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                </View>
                <ConvertedPill amount={value} fromCurrency={(currency ?? from)} toCurrency={to} decimals={decimals} />
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.meta}>No values detected.</Text>
        )}

        <Text style={styles.hint}>Tap a value to load it into the converter above.</Text>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
