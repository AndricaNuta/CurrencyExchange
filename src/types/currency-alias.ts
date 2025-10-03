// currency-alias.ts
export const CCY_ALIASES: Record<string, string> = {
  LEI: 'RON',
  LEU: 'RON',
  KČ: 'CZK',
  KC: 'CZK',
  ZŁ: 'PLN',
  ZL: 'PLN',
  FT: 'HUF',
  '€': 'EUR',
  '$': 'USD',
  'US$': 'USD',
  '£': 'GBP',
  '₪': 'ILS',
  '₺': 'TRY',
  '₽': 'RUB',
  '₩': 'KRW',
  '₴': 'UAH',
  '₹': 'INR',
  'R$': 'BRL',
  DIN: 'RSD',
  'ДИН': 'RSD',
};

export function canonicalCurrency(s?: string) {
  if (!s) return undefined;
  const key = s.trim().replace(/\./g, '').toUpperCase();
  return CCY_ALIASES[key] || key; // if it's already ISO, keep it
}
