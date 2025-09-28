import React, { useMemo, useRef, useState, useEffect } from 'react';
import {Image,
  Pressable,
  Text,
  View,
  Keyboard,
  Dimensions,
  Switch} from 'react-native';
import {useNavigation,
  useRoute,
  type RouteProp,} from '@react-navigation/native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useScanStyles } from './styles';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { useGetBaseTableQuery, useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import type { RootStackParamList } from '../../navigation/RootStackParamList';
import type { OCRResult } from '../../types/PriceOCR';
import type { Candidate } from '../../ocr/ocrShared';
import { extractPrices, PriceHit } from '../../utils/extractPrices';
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
import { useTranslation } from 'react-i18next';
import ZoomableCanvas from '../../components/ZoomableCanvas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'react-native-feather';
import { alpha } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { mapBoxContain as mapBoxToView } from '../../utils/boxMap';
import {mapQuadToViewContain,
  mapQuadToViewCover,
  quadMetrics,} from '../../utils/quadMap';
import { getDetectedCurrency } from '../../utils/getDetectedCurrency';

export default function ScanPreviewScreen() {
  const nav = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanPreview'>>();
  const {
    uri, candidates
  } = route.params;
  const {
    t
  } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useScanStyles();
  const theme = useTheme();
  const from = useSelector((s: RootState) => s.exchange.from);
  const to = useSelector((s: RootState) => s.exchange.to);
  const decimals = useSelector((s: RootState) => s.settings.decimals);
  const dispatch = useDispatch();
  const [pickerOpen, setPickerOpen] = useState(false);
  const priceId = (p: any) =>
    `${p.lineIndex}|${Math.round(p.box.left)}:${Math.round(p.box.top)}|${p.text}`;
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

  const defaultFrom = useSelector((s: RootState) => s.settings.defaultFrom);
  useGetBaseTableQuery({
    base: defaultFrom
  }, {
    skip: !defaultFrom
  });
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

  const sheetTitle =
      mode === 'from' ? t('common.chooseCurrency') :
        mode === 'to'   ? t('converter.convertedTo') :
          '';
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
  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.35}      // 0.30–0.45 feels right
      pressBehavior="close"
    />
  );
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  // final available height for the image area
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const onPickCandidate = (c: Candidate, id: string) => {
    setMiniAmt(c.value.toFixed(2));
    if (c.currency && c.currency !== from) dispatch(setFrom(c.currency));
    setSelectedId(id); // <-- single source of truth for selection
  };
  const [showOriginal, setShowOriginal] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const handleSeeAll = () => {
    setShowAll(true);
    // snap to the largest point to reveal the full list
    sheetRef.current?.snapToIndex(snaps.length - 1);
  };

  const handleSeeLess = () => {
    setShowAll(false);
    // return to bottom (first) snap
    sheetRef.current?.snapToIndex(0);
  };

  return (
    <BottomSheetModalProvider>
      <View style={styles.root}>
        {/* full-screen image */}
        <ZoomableCanvas>
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
            {!showOriginal && ocr &&
  ocr.prices.map((p, i) => {
    // prefer QUAD if present
    const hasQuad =
      p.quad &&
      (p.quad as any).topLeft &&
      (p.quad as any).topRight &&
      (p.quad as any).bottomLeft &&
      (p.quad as any).bottomRight;

    const {
      currency, value
    } = parsePrice(p.text, from);

    const INFLATE_PX = 6;
    const MIN_W = 56;
    const MIN_H = 28;

    if (hasQuad) {
      // 1) map quad to view coords
      const mapped =
        // camera preview usually “covers”, gallery “contains”
        // change if your preview uses contain instead
        mapQuadToViewContain(
          p.quad as any,
          ocr.width, ocr.height,
          imgLayout.w, imgLayout.h
        );

      // 2) derive center/size/angle
      const {
        cx, cy, w, h, angle
      } = quadMetrics(mapped);

      // 3) inflate & clamp
      const W0 = Math.max(w + INFLATE_PX * 2, MIN_W);
      const H0 = Math.max(h + INFLATE_PX * 2, MIN_H);

      let left = cx - W0 / 2;
      let top  = cy - H0 / 2; // ❗ no yOffset in quad path
      const R  = Math.min(left + W0, imgLayout.w);
      const B  = Math.min(top  + H0, imgLayout.h);
      left = Math.max(0, left);
      top  = Math.max(0, top);
      const W = Math.max(0, R - left);
      const H = Math.max(0, B - top);
      const boxW = W0 +10;
      const boxH = H0;
      const pillW = Math.min(Math.max(W * 0.9, 44), Math.min(180, W - 6));
      const pillH = Math.min(Math.max(H * 0.9, 20), Math.min(44,  H - 6));
      const font = Math.max(10, boxH * 0.30);
      const id = `${p.lineIndex}-${i}`;
      const isSelected = selectedId === id;

      const {
        currency: parsedCurrency,value
      } = parsePrice(p.text, from);
      const title = (p as any).labelText || p.lineText || t('common.item');
      const fromCcy = getDetectedCurrency(p, parsedCurrency, from);
      return (
        <Pressable
          key={id}
          onPress={() =>
            onPickCandidate({
              raw: p.text,
              value,
              currency: fromCcy,
              line: title,
              label: title,
              lineIndex: p.lineIndex,
              score: 1,
            }, id)
          }
          style={{
            position: 'absolute',
            left: Math.round(left),
            top: Math.round(top),
            width: Math.round(boxW),
            height: Math.round(boxH),
            transform: [{ rotateZ: `${angle}rad` }],
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isSelected ? 1 : 0,
            borderColor: isSelected ? alpha(theme.colors.tint, 0.9) : 'transparent',
            borderRadius: 8, // small; purely visual, does not change size
          }}
          hitSlop={12}
        >
          <View
            pointerEvents="none"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ConvertedPill
              amount={value}
              fromCurrency={(currency ?? from).toUpperCase()}
              toCurrency={to}
              variant="overlay"
              fixedWidth={boxW}               // <- exact width
              fixedHeight={boxH}
              decimals={decimals}
              containerStyle={{
                paddingHorizontal: 10,                // ensure some minimum
                borderRadius: pillH * 0.35,
                backgroundColor: theme.scheme === 'dark' ? alpha(theme.colors.card, 0.92) : alpha('#FFFFFF', 0.96),
              }}
              textStyle={{
                fontSize: font
              }}
            />
          </View>
        </Pressable>
      );
    }

    // Fallback: old upright rect path (when p.quad is missing)
    const b = mapBoxToView(
      p.box, ocr.width, ocr.height, imgLayout.w, imgLayout.h
    );
    const rect = inflateBox(
      b.left, b.top, b.width, b.height,
      imgLayout.w, imgLayout.h, INFLATE_PX, MIN_W, MIN_H
    );
    const {
      left, top, width: vw, height: vh
    } = rect;
    const pillH = Math.min(Math.max(vh * 0.9, 20), Math.min(44,  vh - 6));
    const content = `${value.toFixed(decimals)} ${to}`;
    const font = Math.max(10, vh * 0.30);
    const pillW = Math.min(200, Math.max(56, content.length * (font * 0.6)));
    const id = `${p.lineIndex}-${i}`;
    const isSelected = selectedId === id;
    const {
      currency: parsedCurrency,
    } = parsePrice(p.text, from);
    const title = (p as any).labelText || p.lineText || t('common.item');
    const fromCcy = getDetectedCurrency(p, parsedCurrency, from);
    return (
      <Pressable
        key={id}
        onPress={() =>
          onPickCandidate({
            raw: p.text,
            value,
            currency: fromCcy,
            line: title,
            label: title,
            lineIndex: p.lineIndex,
            score: 1,
          }, id)
        }
        style={{
          position: 'absolute',
          left: Math.round(left),
          top: Math.round(top),
          width: Math.round(vw),
          height: Math.round(vh),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isSelected ? 1 : 0,
          borderColor: isSelected ? alpha(theme.colors.tint, 0.9) : 'transparent',
          borderRadius: 8,
        }}
        hitSlop={12}
      >
        <View
          pointerEvents="none"
          style={{
            height: pillH,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ConvertedPill
            amount={value}
            fromCurrency={(currency ?? from).toUpperCase()}
            toCurrency={to}
            variant="overlay"
            fixedWidth={vw}
            fixedHeight={vh}
            decimals={decimals}
            containerStyle={{
              minWidth: 56,                  // ensure some minimum
              paddingHorizontal: 10,          // stable padding
              paddingVertical: 4,
              borderRadius: pillH * 0.35,
              backgroundColor: theme.scheme === 'dark' ? alpha(theme.colors.card, 0.92) : alpha('#FFFFFF', 0.96),
            }}
            textStyle={{
              fontSize: font
            }}
          />
        </View>
      </Pressable>
    );
  })
            }
          </View>
        </ZoomableCanvas>

        {/* Close */}
        {!pickerOpen && (
          <View pointerEvents="box-none" style={[styles.topHudWrap, {
            top: insets.top + 40
          }]}>
            <View style={[styles.topHud, sheetIndex === 2 && styles.topHudDim]}>
              <Pressable
                style={[styles.eyeChip, showOriginal ?
                  styles.eyeChipActive
                  : styles.eyeChipInactive]}
                onPress={() => setShowOriginal(v => !v)}
                accessibilityRole="button"
                accessibilityLabel={showOriginal ? 'Show overlays' : 'Show original'}
              >
                {showOriginal
                  ? <EyeOff width={16} height={16} color={theme.colors.icon} />
                  : <Eye    width={16} height={16} color={theme.colors.icon} />
                }
                <Text style={styles.eyeChipText}>{showOriginal ? 'Original' : 'Converted'}</Text>
              </Pressable>

              <Pressable style={styles.close} onPress={() => nav.goBack()}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* bottom sheet with mini converter + detected list */}
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snaps}
          handleIndicatorStyle={styles.handle}
          style={pickerOpen ? styles.fadeBehind : null}
          backgroundStyle={styles.sheetBackground}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            stickyHeaderIndices={[0]}
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
                setPickerOpen(true);
                presentMode('from');
              }}
              onOpenTo={() => {
                Keyboard.dismiss();
                setPickerOpen(true);
                presentMode('to');
              }}
            />
            <View style={styles.detectedHeader}>
              <Text style={styles.detectedTitle}>
    Detected {ocr?.prices?.length ?? 0} prices
              </Text>
              {/*(ocr?.prices?.length ?? 0) > 2 && (
                <Pressable onPress={showAll ? handleSeeLess : handleSeeAll}
                  style={styles.seeAllBtn} hitSlop={8}>
                  <Text style={styles.seeAllTxt}>{showAll ? t('common.seeLess') : t('common.seeAll')}</Text>
                </Pressable>
              )*/}
            </View>
            {/*  Detected prices list (already converted)
            <Text style={styles.title}>{t('scan.detectedPrices')}</Text> */}
            {ocr?.prices?.length ? (
              ocr.prices.map((p, i) => {

                const title = (p as any).labelText || p.lineText || t('common.item');
                const {
                  currency: parsedCurrency, value
                } = parsePrice(p.text, from);
                const fromCcy = getDetectedCurrency(p, parsedCurrency, from);
                const id = priceId(p);
                const isSelected = selectedId === id;
                return (
                  <Pressable
                    key={`${p.lineIndex}-${i}`}
                    onPress={() =>
                      onPickCandidate({
                        raw: p.text,
                        value,
                        currency: fromCcy,
                        line: title,
                        label: title,
                        lineIndex: p.lineIndex,
                        score: 1,
                      },id)
                    }
                    style={[styles.row, isSelected && styles.rowSelected]}
                  >
                    <View style={{
                      width:'70%'
                    }}>
                      <Text style={styles.itemTitle}numberOfLines={1}  >
                        {title}
                      </Text>
                    </View>

                    <ConvertedPill
                      amount={value}
                      fromCurrency={fromCcy}
                      toCurrency={to}
                      decimals={decimals}
                      muteUnit
                    />
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.meta}>{t('scan.noValuesDetected')}</Text>
            )}

            <Text style={styles.hint}>
              {t('scan.tapValueToLoad')}
            </Text>
          </BottomSheetScrollView>
        </BottomSheet>

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
          onDismiss={() => { setPickerOpen(false); handleDismiss(); }}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
