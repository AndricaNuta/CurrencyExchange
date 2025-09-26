import React, { useMemo, useRef, useState, useEffect } from 'react';
import {Image,
  Pressable,
  Text,
  View,
  Keyboard,
  Dimensions,} from 'react-native';
import {useNavigation,
  useRoute,
  type RouteProp,} from '@react-navigation/native';
import BottomSheet, { BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import type { RootStackParamList } from '../../navigation/RootStackParamList';
import type { OCRResult } from '../../types/PriceOCR';
import type { Candidate } from '../../ocr/ocrShared';
import { extractPrices, PriceHit, mapBoxToView } from '../../utils/extractPrices';
import { detectTextInImage } from '../../native/PriceOCR';
import { setFrom, setTo, swap } from '../../redux/slices/exchangeSlice';
import { parsePrice } from '../../utils/parsePrice';
import { ConvertedPill } from '../../components/ConvertedPill';
import { CurrencySwapRow } from './CompactCurrencyRow';
import { useCurrencyPicker } from '../../hooks/useCurrencyPicker';
import { currencyFlag } from '../../utils/currencyFlag';
import { filterByQuery } from '../../utils/filtersCurrency';
import { useSortedCurrencyList } from '../../utils/useSortedCurrencyList';
import { PickerBottomSheet } from '../../components/PickerBottomSheet';

export default function ScanPreviewScreen() {
  const nav = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanPreview'>>();
  const {
    uri, candidates
  } = route.params;

  // global currency settings
  const from = useSelector((s: RootState) => s.exchange.from);
  const to = useSelector((s: RootState) => s.exchange.to);
  const decimals = useSelector((s: RootState) => s.settings.decimals);
  const dispatch = useDispatch();

  // mini-converter local state (prefill with first detected value)
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
    data: basePair, isFetching, isError
  } = useGetPairRateQuery({
    from,
    to
  });
  const baseRate = basePair?.rate ?? 0;

  // bottom sheet ref + snaps
  const sheetRef = useRef<BottomSheet>(null);
  const snaps = useMemo(() => ['24%', '48%', '86%'], []);
  const screenH = Dimensions.get('window').height;

  // OCR + overlays
  const [ocr, setOcr] = useState<OCRResult | null>(null);
  const [hits, setHits] = useState<PriceHit[]>([]);
  const [imgLayout, setImgLayout] = useState({
    w: 0,
    h: 0
  });

  const {
    data: currencies
  } = useGetCurrenciesQuery();
  const list = useSortedCurrencyList(currencies);

  const {
    modalRef, mode, presentMode, handleDismiss
  } = useCurrencyPicker();
  const [fromQ, setFromQ] = useState('');
  const [toQ, setToQ] = useState('');

  const fromSheetItems = useMemo(
    () =>
      list
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
    () =>
      list
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

  // Run OCR when a new image is opened
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await detectTextInImage(uri);
        console.log('OCR result:', {
          img: {
            w: res.width,
            h: res.height
          },
          lines: res.lines.length,
          words: res.words.length,
        });

        const found = extractPrices(res);
        console.table(
          found.slice(0, 5).map(h => ({
            priceText: h.priceText,
            currency: h.currency,
            lineIndex: h.lineIndex,
            priceBox: h.priceBox,
          }))
        );

        if (cancelled) return;
        setOcr(res);
        setHits(found);
      } catch (e) {
        console.warn('OCR failed', e);
        setOcr(null);
        setHits([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const inflateBox = (
    left: number,
    top: number,
    w: number,
    h: number,
    viewW: number,
    viewH: number,
    inflate: number,
    minW: number,
    minH: number
  ) => {
    // Inflate equally on all sides
    let L = left - inflate;
    let T = top - inflate;
    let W = w + inflate * 2;
    let H = h + inflate * 2;

    // Enforce minimum size (grow around center)
    if (W < minW) {
      const add = (minW - W) / 2;
      L -= add;
      W = minW;
    }
    if (H < minH) {
      const add = (minH - H) / 2;
      T -= add;
      H = minH;
    }

    // Clamp to view
    const R = clamp(L + W, 0, viewW);
    const B = clamp(T + H, 0, viewH);
    L = clamp(L, 0, viewW);
    T = clamp(T, 0, viewH);

    // Recompute width/height after clamping
    W = Math.max(0, R - L);
    H = Math.max(0, B - T);
    return {
      left: L,
      top: T,
      width: W,
      height: H
    };
  };

  // layout math for available image height

  const snapsPx = snaps.map(s =>
    typeof s === 'string' && s.endsWith('%') ? (parseFloat(s) / 100) * screenH : Number(s)
  );
  const minSnapPx = Math.min(...snapsPx);

  // final available height for the image area

  const onPickCandidate = (c: Candidate) => {
    setMiniAmt(c.value.toFixed(2));
    if (c.currency && c.currency !== from) {
      dispatch(setFrom(c.currency));
    }
  };

  return (
    <BottomSheetModalProvider>
+      <View style={styles.root}>
        {/* full-screen image */}
        <View
          style={[
            styles.imageWrap,
            {
              bottom: minSnapPx, // instead of a hardcoded value
            },
          ]}
          onLayout={e => {
            const {
              width, height
            } = e.nativeEvent.layout;
            setImgLayout({
              w: width,
              h: height
            });
          }}
        >
          <Image source={{
            uri
          }} style={styles.img} resizeMode="contain" />

          {/* Overlays */}
          {ocr &&
          ocr.prices.map((p, i) => {
            const b = mapBoxToView(p.box, ocr.width, ocr.height, imgLayout.w, imgLayout.h);
            const {
              currency, value
            } = parsePrice(p.text, 'EUR');

            // Tweak these to taste
            const INFLATE_PX = 6;
            const MIN_W = 56;
            const MIN_H = 28;

            // apply vertical correction before inflating
            const baseLeft = b.left;
            const baseTop = b.top + 45;
            const baseW = b.width;
            const baseH = b.height;

            const rect = inflateBox(
              baseLeft,
              baseTop,
              baseW,
              baseH,
              imgLayout.w,
              imgLayout.h,
              INFLATE_PX,
              MIN_W,
              MIN_H
            );

            const {
              left, top, width: vw, height: vh
            } = rect;

            const boxStyle = {
              position: 'absolute' as const,
              left,
              top,
              width: vw,
              height: vh,
              borderWidth: 1,
              borderColor: '#FFC83D',
              borderRadius: 10,
            };

            const pillW = clamp(vw * 0.9, 44, Math.min(180, vw - 6));
            const pillH = clamp(vh * 0.9, 20, Math.min(44, vh - 6));
            const font = clamp(pillH * 0.42, 9, 18);

            return (
              <Pressable
                key={`${p.lineIndex}-${i}`}
                onPress={() =>
                  onPickCandidate({
                    raw: p.text,
                    value,
                    currency: (currency ?? from).toUpperCase(),
                    line: p.lineText,
                    label: p.lineText,
                    lineIndex: p.lineIndex,
                    score: 1,
                  })
                }
                style={boxStyle}
                hitSlop={12}
              >
                {/* pill centered INSIDE the yellow box */}
                <View
                  style={{
                    position: 'absolute',
                    left: (vw - pillW) / 2,
                    top: (vh - pillH) / 2,
                    width: pillW,
                    height: pillH,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  pointerEvents="none"
                >
                  <ConvertedPill
                    amount={value}
                    fromCurrency={(currency ?? from).toUpperCase()}
                    toCurrency={to}
                    decimals={decimals}
                    containerStyle={{
                      height: pillH,
                      width: pillW,
                      paddingHorizontal: Math.min(8, pillW * 0.18),
                      paddingVertical: Math.min(4, pillH * 0.25),
                      borderRadius: pillH * 0.35,
                      backgroundColor: 'rgba(255,255,255,0.96)',
                    }}
                    textStyle={{
                      fontSize: font,
                    }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

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
            <CurrencySwapRow
              from={from}
              to={to}
              amount={miniAmt}
              onAmountChange={setMiniAmt}
              decimals={decimals}
              rate={baseRate}
              isFetching={isFetching}
              rateError={isError}
              onSwap={() => dispatch(swap())}
              renderFlag={(code) => <Text>{currencyFlag(code)}</Text>}
              onOpenFrom={() => {
                Keyboard.dismiss();
                // OPEN PICKER AS MODAL ON TOP
                presentMode('from');
              }}
              onOpenTo={() => {
                Keyboard.dismiss();
                // OPEN PICKER AS MODAL ON TOP
                presentMode('to');
              }}
            />

            {/* --- Detected prices list (already converted) --- */}
            <Text style={styles.title}>Detected prices</Text>
            {ocr?.prices?.length ? (
              ocr.prices.map((p, i) => {
                const {
                  currency, value
                } = parsePrice(p.text, from);
                const title = (p as any).labelText || p.lineText || 'Item';

                return (
                  <Pressable
                    key={`${p.lineIndex}-${i}`}
                    onPress={() =>
                      onPickCandidate({
                        raw: p.text,
                        value,
                        currency: (currency ?? from).toUpperCase(),
                        line: title,
                        label: title,
                        lineIndex: p.lineIndex,
                        score: 1,
                      })
                    }
                    style={styles.row}
                  >
                    <View style={{
                      flex: 1
                    }}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {title}
                      </Text>
                    </View>

                    <ConvertedPill
                      amount={value}
                      fromCurrency={currency ?? from}
                      toCurrency={to}
                      decimals={decimals}
                    />
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.meta}>No values detected.</Text>
            )}

            <Text style={styles.hint}>
              Tap a value to load it into the converter above.
            </Text>
          </BottomSheetScrollView>
        </BottomSheet>

        {/* MODAL PICKER OVERLAY (PORTALS ABOVE EVERYTHING) */}
        <PickerBottomSheet
          ref={modalRef}
          title={sheetTitle}
          items={sheetItems}
          search={sheetSearch}
          initialIndex={0}
          onSelect={(code) => {
            if (mode === 'from') dispatch(setFrom(code));
            if (mode === 'to') dispatch(setTo(code));
            modalRef.current?.dismiss();
          }}
          onDismiss={handleDismiss}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
