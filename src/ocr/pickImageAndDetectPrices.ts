import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';

export type Candidate = {
  raw: string;
  value: number;
  currency?: string;
  line?: string;
  label?: string;        // ⬅️ new: item text
  lineIndex?: number;    // ⬅️ new: for context/debug
  score: number;
};

const SYMBOL_TO_CODE: Record<string, string> = {
  '€':'EUR', '$':'USD', '£':'GBP', '¥':'JPY', '₺':'TRY', '₩':'KRW', '₪':'ILS', '₹':'INR', 'lei':'RON'
};
const CODE_SET = new Set(['EUR','USD','GBP','JPY','RON','CHF','CAD','AUD','NZD','PLN','HUF','SEK','NOK','DKK','CZK','TRY','BGN','RSD','UAH','ILS','AED','SAR','INR']);

function parseFlexibleAmount(raw: string): number | null {
  let s = raw.replace(/\s+/g,'').replace(/[^\d.,-]/g,''); if(!s) return null;
  const lc=s.lastIndexOf(','), ld=s.lastIndexOf('.'); let dec:','|'.'|null=null;
  if(lc!==-1&&ld!==-1) dec=lc>ld?',':'.';
  else if(lc!==-1) dec=/,\d{2}$/.test(s)?',':null;
  else if(ld!==-1) dec=/\.\d{2}$/.test(s)?'.':null;
  if(dec===','){ s=s.replace(/\./g,'').replace(',','.'); }
  else if(dec==='.'){ s=s.replace(/,/g,''); }
  else { s=s.replace(/[.,](?=\d{3}(\D|$))/g,''); }
  const n=Number(s); return Number.isFinite(n)?n:null;
}

function isSectionHeader(t:string){
  const s=t.trim();
  if(!s) return false;
  return /^[A-Z][A-Z\s\-&]{3,}$/.test(s) && !/\d/.test(s);
}

function cleanLabel(s:string){
  return s.replace(/[\.\-·•\u2022]+$/,'').replace(/\s{2,}/g,' ').trim();
}

function detectPriceCandidatesWithLabels(lines: string[]): Candidate[] {
  const out: Candidate[] = [];
  const norm = lines.map(l => l.replace(/\s+/g,' ').trim());

  // price (with optional currency/code) anywhere in a line
  const re = /(?:([€$£¥₩₺₪₹])|\b([A-Z]{3})\b|\blei\.?\b)?\s*-?\s*(\d[\d.,]*)\s*(?:([€$£¥₩₺₪₹])|\b([A-Z]{3})\b|\blei\.?\b)?/gi;

  norm.forEach((line, i) => {
    if (!line) return;

    for (const m of line.matchAll(re) as Iterable<RegExpMatchArray & { index: number }>) {
      const raw = m[0];
      const value = parseFlexibleAmount(raw);
      if (value==null || value<=0 || value>1_000_000) continue;

      // currency from symbol or code (before/after)
      let currency: string | undefined;
      const sym = m[1] || m[4];
      if (sym) currency = SYMBOL_TO_CODE[sym] ?? currency;
      const code = m[2] || m[5];
      if (!currency && code && CODE_SET.has(code)) currency = code;
      if (!currency && /lei\.?/i.test(raw)) currency = 'RON';

      // label: left side of the line before the price; if empty, use previous non-empty non-header line
      let label = cleanLabel(line.slice(0, m.index));
      if (!label || label.length < 2) {
        for (let j = i - 1; j >= 0; j--) {
          const prev = norm[j];
          if (!prev) continue;
          if (isSectionHeader(prev)) break; // don't cross section headers
          if (prev && !/\d[\d.,]*\s*$/.test(prev)) { // previous line that isn't just a number
            label = cleanLabel(prev);
            break;
          }
        }
      }

      // score (reuse your scheme; small boost for having a label)
      let score = 1 + (currency?2:0) + (/\d{2}\b/.test(raw)?1:0) + (label?1:0);

      out.push({
        raw,
        value,
        currency,
        line: line,
        label,
        lineIndex: i,
        score,
      });
    }
  });

  const map = new Map<string, Candidate>();
  for (const c of out) {
    const k = `${(c.label??'').toLowerCase()}|${c.currency??'UNK'}|${c.value.toFixed(2)}`;
    const prev = map.get(k);
    if (!prev || c.score > prev.score) map.set(k, c);
  }
  return [...map.values()].sort((a,b)=>b.score-a.score);
}

export async function pickImageAndDetectPrices(limit = 8): Promise<{ candidates: Candidate[]; asset?: Asset } | null> {
  const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, includeExtra: true });
  const asset = res?.assets?.[0];
  if (!asset?.uri) return null;

  const rawLines = await TextRecognition.recognize(asset.uri);
  const lines = (rawLines ?? []).map(l => l.replace(/\s+/g,' ').trim()).filter(Boolean);

  const candidates = detectPriceCandidatesWithLabels(lines).slice(0, limit);
  return { candidates, asset };
}
