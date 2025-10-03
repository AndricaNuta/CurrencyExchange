// price-from-native.ts
import { canonicalCurrency } from '../types/currency-alias';

// parse "1.234,56" | "1,234.56" | "123,45" | "123.45"
function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d.,-]/g, '');
  const lastDot = digits.lastIndexOf('.');
  const lastComma = digits.lastIndexOf(',');
  const decimalSep = Math.max(lastDot, lastComma) === lastComma ? ',' : '.';
  const normalized = digits
    .replace(new RegExp('\\' + (decimalSep === ',' ? '\\.' : ','), 'g'), '')   // remove thousands
    .replace(decimalSep, '.');                                                 // unify decimal
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** Use native signals first; never force global `from`. */
export function valueAndCurrencyFromNative(p: any, fallbackFrom: string) {
  const rawText = p.raw ?? p.text ?? '';
  const value =
      typeof p.amount === 'number'
        ? p.amount
        : Number(rawText.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;

  const currency =
      p.currencyCode ??
      p.currencyDefault ??
      p.rawCurrency ??
      fallbackFrom;

  return {
    value,
    currency: String(currency).toUpperCase()
  };
}
