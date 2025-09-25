import type { Candidate } from '../ocr/pickImageAndDetectPrices';
import type { PriceHit } from '../utils/extractPrices';

export function priceHitToCandidate
(h: PriceHit, fallbackCurrency: string): Candidate {
  const amount = Number(h.amountRaw.replace(',', '.')) || 0;

  return {
    raw: h.priceText,
    value: amount,
    currency: (h.currency ?? fallbackCurrency).toUpperCase(),
    line: h.lineText,
    label: h.lineText,
    lineIndex: h.lineIndex,
    score: 1,
  };
}
