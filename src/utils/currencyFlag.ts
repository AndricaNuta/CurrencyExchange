const SPECIAL_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', 
  XOF: '🌍', 
  XAF: '🌍',
  XPF: '🌺',
};

const DIRECT: Record<string, string> = {
  USD: '🇺🇸',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  CHF: '🇨🇭',
  JPY: '🇯🇵',
  NOK: '🇳🇴',
  SEK: '🇸🇪',
  DKK: '🇩🇰',
  RON: '🇷🇴',
  PLN: '🇵🇱',
  HUF: '🇭🇺',
  CZK: '🇨🇿',
  TRY: '🇹🇷',
  BGN: '🇧🇬',
  AED: '🇦🇪',
  SAR: '🇸🇦',
  INR: '🇮🇳',
  ILS: '🇮🇱',
};

/** Convert a 2-letter country code to emoji. */
function countryToFlag(cc: string): string {
  if (!cc || cc.length !== 2) return '🌐';
  const A = 0x1f1e6; // 🇦
  const up = cc.toUpperCase();
  return String.fromCodePoint(A + (up.charCodeAt(0) - 65), A + (up.charCodeAt(1) - 65));
}

/*
   * return the most sensible flag for a 3-letter currency code.
   * Fallback '🌐' - unknown.
   */
export function currencyFlag(code?: string): string {
  if (!code) return '🌐';
  const c = code.toUpperCase();

  if (DIRECT[c]) return DIRECT[c];
  if (SPECIAL_FLAGS[c]) return SPECIAL_FLAGS[c];
  // Map currency -> country when it’s a straightforward single country.
  const CCY_TO_COUNTRY: Record<string, string> = {
    RSD: 'RS',
    UAH: 'UA',
    BGN: 'BG',
    ZAR: 'ZA',
    MXN: 'MX',
    BRL: 'BR',
    KRW: 'KR',
    SGD: 'SG',
    HKD: 'HK',
    THB: 'TH',
    TWD: 'TW',
    MYR: 'MY',
    PHP: 'PH',
  };
  if (CCY_TO_COUNTRY[c]) return countryToFlag(CCY_TO_COUNTRY[c]);
  return '🌐';
}
