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
import { useGetPairRateQuery } from '../../services/currencyApi';
import { OCRResult } from '../../types/PriceOCR';
import { extractPrices, PriceHit, mapBoxToView } from '../../utils/extractPrices';
import { detectTextInImage } from '../../native/PriceOCR';
import { priceHitToCandidate } from '../../utils/priceHitToCandidate';
import { resetToDefaults, setFrom, setTo, swap } from '../../redux/slices/exchangeSlice';
import { parsePrice } from '../../utils/parsePrice';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const screenH = Dimensions.get('window').height;

  const miniAmtNum = Number(miniAmt.replace(',', '.')) || 0;
  const miniConverted = baseRate ? miniAmtNum * baseRate : 0;

  const onPickCandidate = (c: Candidate) => {
    setMiniAmt(c.value.toFixed(2));
    if (c.currency && c.currency !== from) {
      dispatch(setFrom(c.currency));
    }
  };
  const insets = useSafeAreaInsets();
  const winH = Dimensions.get('window').height;

  // convert snaps to pixels
  const snapsPx = snaps.map(s =>
    typeof s === 'string' && s.endsWith('%')
      ? (parseFloat(s) / 140) * screenH
      : Number(s)
  );
  const minSnapPx = Math.min(...snapsPx);

  // track which snap is active
  const [sheetIndex, setSheetIndex] = useState(1); // you start at 48%
  const currentSheetHeight = snapsPx[Math.min(sheetIndex, snapsPx.length - 1)];

  // final available height for the image area
  const imageAreaH = Math.max(0, winH - insets.top - currentSheetHeight);

  const [ocr, setOcr] = useState<OCRResult | null>(null);
  const [hits, setHits] = useState<PriceHit[]>([]);
  const [imgLayout, setImgLayout] = useState({
    w: 0,
    h: 0
  });

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

        console.table(found.slice(0, 5).map(h => ({
          priceText: h.priceText,
          currency: h.currency,
          lineIndex: h.lineIndex,
          priceBox: h.priceBox,
        })));// from native iOS Vision
        if (cancelled) return;
        setOcr(res);
        setHits(extractPrices(res));

      } catch (e) {
        console.warn('OCR failed', e);
        setOcr(null);
        setHits([]);
      }
    })();
    return () => { cancelled = true; };
  }, [uri]);
  const clamp = (v:number, min:number, max:number) => Math.min(max, Math.max(min, v));
  const inflateBox = (
    left:number, top:number, w:number, h:number,
    viewW:number, viewH:number,
    inflate:number, minW:number, minH:number,
  ) => {
    // Inflate equally on all sides
    let L = left - inflate;
    let T = top  - inflate;
    let W = w + inflate * 2;
    let H = h + inflate * 2;

    // Enforce minimum size (grow around center)
    if (W < minW) { const add = (minW - W) / 2; L -= add; W = minW; }
    if (H < minH) { const add = (minH - H) / 2; T -= add; H = minH; }

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
  return (
    <View style={styles.root}>
      {/* full-screen image */}
      <View
  style={[
    styles.imageWrap,
    {

      bottom: minSnapPx, // instead of a hardcoded 150
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
        }} style={styles.img} resizeMode='contain' />

        {/* Overlays */}
        {ocr && ocr.prices.map((p, i) => {
          const b = mapBoxToView(p.box, ocr.width, ocr.height, imgLayout.w, imgLayout.h);
          const {
            currency, value
          } = parsePrice(p.text, 'EUR');

          // --- Inflate & min size ---
          // tweak these three numbers to taste:
          const INFLATE_PX = 6;     // how much padding around the yellow box
          const MIN_W = 56;         // minimum yellow box width in px
          const MIN_H = 28;         // minimum yellow box height in px

          // apply your vertical correction (+45) *before* inflating
          const baseLeft = b.left;
          const baseTop  = b.top + 45;
          const baseW    = b.width;
          const baseH    = b.height;

          const rect = inflateBox(baseLeft, baseTop, baseW, baseH, imgLayout.w, imgLayout.h, INFLATE_PX, MIN_W, MIN_H);
          const {
            left, top, width: vw, height: vh
          } = rect;

          // --- Yellow rectangle style ---
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

          // --- Pill sizing: centered and shrinks to fit ---
          // Target is 90% of the yellow box but clamped to reasonable bounds
          const pillW = clamp(vw * 0.9, 44, Math.min(180, vw - 6));
          const pillH = clamp(vh * 0.9, 20, Math.min(44,  vh - 6));
          const font  = clamp(pillH * 0.42, 9, 18);

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
                  top:  (vh - pillH) / 2,
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
                    paddingVertical:   Math.min(4, pillH * 0.25),
                    borderRadius: pillH * 0.35,
                    backgroundColor: 'rgba(255,255,255,0.96)',
                  }}
                  textStyle={{
                    fontSize: font
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
        onChange={setSheetIndex}
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
                onPress={() => dispatch(swap())}
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
          {ocr?.prices?.length ? (
            ocr.prices.map((p, i) => {
              const {
                currency, value
              } = parsePrice(p.text, from);
              const title = (p as any).labelText || p.lineText || 'Item';

              return (
                <Pressable
                  key={`${p.lineIndex}-${i}`}
                  onPress={() => onPickCandidate({
                    raw: p.text,
                    value,
                    currency: (currency ?? from).toUpperCase(),
                    line: title,
                    label: title,
                    lineIndex: p.lineIndex,
                    score: 1,
                  })}
                  style={styles.row}
                >
                  <View style={{
                    flex: 1
                  }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    {/* optional: remove this to avoid showing "$ 7.00" */}
                    {/* <Text style={styles.itemSub}>{currency ? `${currency} ` : ''}{value.toFixed(2)}</Text> */}
                  </View>

                  <ConvertedPill
                    amount={value}
                    fromCurrency={(currency ?? from)}
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
    </View>
  );
}function ConvertedPill({
  amount,
  fromCurrency,
  toCurrency,
  decimals,
  containerStyle,
  textStyle,
}: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
  containerStyle?: any;
  textStyle?: any;
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
    <View style={[styles.convPill, containerStyle]}>
      <Text
        style={[styles.convMain, textStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
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
