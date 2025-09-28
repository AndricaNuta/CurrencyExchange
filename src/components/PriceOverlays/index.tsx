import React from 'react';
import { View, Pressable } from 'react-native';
import { mapBoxContain, mapBoxCover} from '../../utils/boxMap';
import { parsePrice } from '../../utils/parsePrice';
import { ConvertedPill } from '../ConvertedPill';
import type { OCRResult } from '../../types/PriceOCR';
import { useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import {
  mapQuadToViewContain,
  mapQuadToViewCover,
  quadMetrics,
} from '../../utils/quadMap';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function PriceOverlays({
  ocr,
  imgW, imgH,
  from, to, decimals,
  onPick,
  mode = 'image',
  yOffset = 45,
  inflate = 6, minW = 56, minH = 28,
}: {
  ocr: OCRResult | null;
  imgW: number; imgH: number;
  from: string; to: string; decimals: number;
  onPick: (c: { raw: string; value: number; currency?: string; label?: string; lineIndex?: number }) => void;
  mode?: 'image' | 'camera';
  yOffset?: number;
  inflate?: number; minW?: number; minH?: number;
}) {
  const t = useTheme();
  const selectionBorder = alpha(t.colors.tint, 0.9);
  const normalBorder = 'transparent';
  const pillBg = t.scheme === 'dark' ? alpha(t.colors.card, 0.92) : alpha('#FFFFFF', 0.96);

  if (!ocr || !imgW || !imgH) return null;

  return (
    <>
      {ocr.prices.map((p, i) => {
        const { currency, value } = parsePrice(p.text, from);
        const isSelected = false;

        // --- Prefer rotated QUAD when present ---
        const hasQuad =
          p.quad &&
          (p.quad as any).topLeft &&
          (p.quad as any).topRight &&
          (p.quad as any).bottomLeft &&
          (p.quad as any).bottomRight;

        if (hasQuad) {
          // map the quad to view space
          const mapped =
            mode === 'camera'
              ? mapQuadToViewCover(p.quad as any, ocr.width, ocr.height, imgW, imgH)
              : mapQuadToViewContain(p.quad as any, ocr.width, ocr.height, imgW, imgH);

          const { cx, cy, w, h, angle } = quadMetrics(mapped);

          // Inflate around center
          const W0 = Math.max(w + inflate * 2, minW);
          const H0 = Math.max(h + inflate * 2, minH);

          // Clamp box inside view
          let left = cx - W0 / 2;
          let top  = cy - H0 / 2 + (mode === 'image' ? yOffset : 0); // if you still need the visual nudge in image mode
          const R = clamp(left + W0, 0, imgW);
          const B = clamp(top + H0, 0, imgH);
          left = clamp(left, 0, imgW);
          top  = clamp(top, 0, imgH);
          const W = Math.max(0, R - left);
          const H = Math.max(0, B - top);

          const pillW = clamp(W * 0.9, 44, Math.min(180, W - 6));
          const pillH = clamp(H * 0.9, 20, Math.min(44,  H - 6));
          const font  = clamp(pillH * 0.42, 9, 18);

          return (
            <Pressable
              key={`${p.lineIndex}-${i}`}
              onPress={() =>
                onPick({
                  raw: p.text,
                  value,
                  currency: (currency ?? from).toUpperCase(),
                  label: (p as any).labelText || p.lineText,
                  lineIndex: p.lineIndex,
                })
              }
              style={{
                position: 'absolute',
                left, top, width: W, height: H,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ rotateZ: `${angle}rad` }], // <-- rotate the whole overlay
                borderWidth: 1,
                borderColor: isSelected ? selectionBorder : normalBorder,
                borderRadius: 10,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  width: pillW, height: pillH,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ConvertedPill
                  amount={value}
                  fromCurrency={(currency ?? from).toUpperCase()}
                  toCurrency={to}
                  decimals={decimals}
                  containerStyle={{
                    height: pillH, width: pillW,
                    paddingHorizontal: Math.min(8, pillW * 0.18),
                    paddingVertical:   Math.min(4, pillH * 0.25),
                    borderRadius: pillH * 0.35,
                    backgroundColor: pillBg,
                  }}
                  textStyle={{ fontSize: font }}
                />
              </View>
            </Pressable>
          );
        }

        // --- Fallback: your existing axis-aligned rect path ---
        let left: number, top: number, w: number, h: number;
        if (mode === 'camera') {
          const b = mapBoxCover(p.box, ocr.width, ocr.height, imgW, imgH);
          left = b.left; top = b.top; w = b.width; h = b.height;
        } else {
          const b = mapBoxContain(p.box, ocr.width, ocr.height, imgW, imgH);
          left = b.left; top = b.top + yOffset; w = b.width; h = b.height;
        }

        left -= inflate; top -= inflate; w += inflate * 2; h += inflate * 2;
        if (w < minW) { const a = (minW - w) / 2; left -= a; w = minW; }
        if (h < minH) { const a = (minH - h) / 2; top  -= a; h = minH; }
        const R = clamp(left + w, 0, imgW);
        const B = clamp(top + h, 0, imgH);
        left = clamp(left, 0, imgW);
        top  = clamp(top, 0, imgH);
        w = Math.max(0, R - left);
        h = Math.max(0, B - top);

        const pillW = clamp(w * 0.9, 44, Math.min(180, w - 6));
        const pillH = clamp(h * 0.9, 20, Math.min(44,  h - 6));
        const font  = clamp(pillH * 0.42, 9, 18);

        return (
          <Pressable
            key={`${p.lineIndex}-${i}`}
            onPress={() =>
              onPick({
                raw: p.text,
                value,
                currency: (currency ?? from).toUpperCase(),
                label: (p as any).labelText || p.lineText,
                lineIndex: p.lineIndex,
              })
            }
            style={{
              position: 'absolute',
              left, top, width: w, height: h,
              borderWidth: 1,
              borderColor: isSelected ? selectionBorder : normalBorder,
              borderRadius: 10,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (w - pillW) / 2,
                top:  (h - pillH) / 2,
                width: pillW, height: pillH,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ConvertedPill
                amount={value}
                fromCurrency={(currency ?? from).toUpperCase()}
                toCurrency={to}
                decimals={decimals}
                containerStyle={{
                  height: pillH, width: pillW,
                  paddingHorizontal: Math.min(8, pillW * 0.18),
                  paddingVertical:   Math.min(4, pillH * 0.25),
                  borderRadius: pillH * 0.35,
                  backgroundColor: pillBg,
                }}
                textStyle={{ fontSize: 10 }}
              />
            </View>
          </Pressable>
        );
      })}
    </>
  );
}
