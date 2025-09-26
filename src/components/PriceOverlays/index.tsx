import React from 'react';
import { View, Pressable } from 'react-native';
import { mapBoxToView } from '../../utils/extractPrices'; // for static images (contain + letterbox)
import { mapBoxToCoverView } from '../../utils/boxMap';    // for live camera (cover + crop)
import { parsePrice } from '../../utils/parsePrice';
import { ConvertedPill } from '../ConvertedPill';
import type { OCRResult } from '../../types/PriceOCR';

const clamp = (v:number, min:number, max:number) => Math.min(max, Math.max(min, v));

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
  if (!ocr || !imgW || !imgH) return null;

  return (
    <>
      {ocr.prices.map((p, i) => {
        let left: number, top: number, w: number, h: number;

        if (mode === 'camera') {
          const b = mapBoxToCoverView(p.box, ocr.width, ocr.height, imgW, imgH);
          left = b.left; top = b.top; w = b.width; h = b.height;
        } else {
          const b = mapBoxToView(p.box, ocr.width, ocr.height, imgW, imgH);
          left = b.left; top = b.top + yOffset; w = b.width; h = b.height;
        }

        // inflate + clamp
        left -= inflate; top -= inflate; w += inflate*2; h += inflate*2;
        if (w < minW) { const a=(minW-w)/2; left-=a; w=minW; }
        if (h < minH) { const a=(minH-h)/2; top -=a; h=minH; }
        const R = clamp(left + w, 0, imgW); const B = clamp(top + h, 0, imgH);
        left = clamp(left, 0, imgW); top = clamp(top, 0, imgH);
        w = Math.max(0, R-left); h = Math.max(0, B-top);

        const { currency, value } = parsePrice(p.text, from);
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
              borderWidth: 1, borderColor: '#FFC83D', borderRadius: 10,
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
                  backgroundColor: 'rgba(255,255,255,0.96)',
                }}
                textStyle={{ fontSize: font }}
              />
            </View>
          </Pressable>
        );
      })}
    </>
  );
}
