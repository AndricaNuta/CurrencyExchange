import { Image } from 'react-native';
import ImageResizer from 'react-native-image-resizer';

export type Candidate = {
  raw: string;
  value: number;
  currency?: string;
  line?: string;
  label?: string;
  lineIndex?: number;
  score: number;
};

export const SYMBOL_TO_CODE: Record<string, string> = {
  '€':'EUR',
  '$':'USD',
  '£':'GBP',
  '¥':'JPY',
  '₺':'TRY',
  '₩':'KRW',
  '₪':'ILS',
  '₹':'INR',
  lei:'RON'
};

export const ISO_CODES = [
  'EUR','USD','GBP','JPY','RON','CHF','CAD','AUD','NZD',
  'PLN','HUF','SEK','NOK','DKK','CZK','TRY','BGN','RSD',
  'UAH','ILS','AED','SAR','INR'
];
export const CODE_SET = new Set(ISO_CODES);

export function parseFlexibleAmount(raw: string): number | null {
  let s = raw.replace(/\s+/g, '').replace(/[^\d.,-]/g, '');
  if (!s) return null;
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  let dec: ',' | '.' | null = null;
  if (lc !== -1 && ld !== -1) dec = lc > ld ? ',' : '.';
  else if (lc !== -1) dec = /,\d{2}$/.test(s) ? ',' : null;
  else if (ld !== -1) dec = /\.\d{2}$/.test(s) ? '.' : null;

  if (dec === ',') s = s.replace(/\./g, '').replace(',', '.');
  else if (dec === '.') s = s.replace(/,/g, '');
  else s = s.replace(/[.,](?=\d{3}(\D|$))/g, '');

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function detectPriceCandidatesWithLabels(lines: string[]): Candidate[] {
  const out: Candidate[] = [];
  const norm = lines.map(l => l.replace(/\s+/g, ' ').trim());
  const re = /(?:([€$£¥₩₺₪₹])|\b([A-Z]{3})\b|\blei\.?\b)?\s*-?\s*(\d[\d.,]*)\s*(?:([€$£¥₩₺₪₹])|\b([A-Z]{3})\b|\blei\.?\b)?/gi;

  const isSectionHeader = (t: string) => {
    const s = t.trim();
    return !!s && /^[A-Z][A-Z\s\-&]{3,}$/.test(s) && !/\d/.test(s);
  };
  const cleanLabel = (s: string) => s.replace(/[\.\-·•\u2022]+$/, '').replace(/\s{2,}/g, ' ').trim();

  norm.forEach((line, i) => {
    if (!line) return;
    for (const m of line.matchAll(re) as any) {
      const raw = m[0];
      const value = parseFlexibleAmount(raw);
      if (value == null || value <= 0 || value > 1_000_000) continue;

      let currency: string | undefined;
      const sym = m[1] || m[4];
      const code = m[2] || m[5];
      if (sym) currency = SYMBOL_TO_CODE[sym] ?? currency;
      if (!currency && code && CODE_SET.has(code)) currency = code;
      if (!currency && /lei\.?/i.test(raw)) currency = 'RON';

      let label = cleanLabel(line.slice(0, m.index));
      if (!label || label.length < 2) {
        for (let j = i - 1; j >= 0; j--) {
          const prev = norm[j];
          if (!prev) continue;
          if (isSectionHeader(prev)) break;
          if (!/\d[\d.,]*\s*$/.test(prev)) { label = cleanLabel(prev); break; }
        }
      }

      const score = 1 + (currency ? 2 : 0)
      + (/\d{2}\b/.test(raw) ? 1 : 0)
      + (label ? 1 : 0);
      out.push({
        raw,
        value,
        currency,
        line,
        label,
        lineIndex: i,
        score
      });
    }
  });

  const map = new Map<string, Candidate>();
  for (const c of out) {
    const k = `${(c.label ?? '').toLowerCase()}|${c.currency ?? 'UNK'}|${c.value.toFixed(2)}`;
    const prev = map.get(k);
    if (!prev || c.score > prev.score) map.set(k, c);
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}

async function getImageSize(uri: string):
Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => resolve({
        width: w,
        height: h
      }),
      (e) => reject(e)
    );
  });
}

export async function normalizeForOCR(
  asset: { uri: string; width?: number; height?: number },
  maxDim = 2048,
  minDim = 1200
) {
  let width = asset.width ?? 0;
  let height = asset.height ?? 0;
  if (!width || !height) {
    try {
      const s = await getImageSize(asset.uri);
      width = s.width; height = s.height;
    } catch {
      // last resort: don’t resize at all if we can’t measure
      return {
        uri: asset.uri,
        width: width || maxDim,
        height: height || maxDim
      };
    }
  }

  const minSide = Math.min(width, height);
  const scaleUp = Math.max(1, minDim / minSide);
  const scaledW = Math.round(width * scaleUp);
  const scaledH = Math.round(height * scaleUp);
  const cap = Math.max(scaledW, scaledH) > maxDim ?
    maxDim / Math.max(scaledW, scaledH) : 1;
  const targetW = Math.round(scaledW * cap);
  const targetH = Math.round(scaledH * cap);

  const out = await ImageResizer.createResizedImage(
    asset.uri,
    targetW,
    targetH,
    'JPEG',
    92,
    0,
    undefined,
    false,
    {
      onlyScaleDown: false
    }
  );

  return {
    uri: out.uri,
    width: out.width,
    height: out.height
  };
}
