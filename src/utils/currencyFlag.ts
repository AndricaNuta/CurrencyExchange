// Maps that need a special (non-country) flag or multi-country currencies.
const SPECIAL_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', // European Union
  XOF: '🌍',  // (example) West Africa CFA – pick what you like
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

/** Convert a 2-letter country code to a flag emoji. */
function countryToFlag(cc: string): string {
  if (!cc || cc.length !== 2) return '🌐';
  const A = 0x1f1e6; // 🇦
  const up = cc.toUpperCase();
  return String.fromCodePoint(A + (up.charCodeAt(0) - 65), A + (up.charCodeAt(1) - 65));
}

/**
   * Return the most sensible flag for a 3-letter currency code.
   * Falls back to '🌐' if unknown.
   */
export function currencyFlag(code?: string): string {
  if (!code) return '🌐';
  const c = code.toUpperCase();

  // 1) explicit mapping first
  if (DIRECT[c]) return DIRECT[c];
  if (SPECIAL_FLAGS[c]) return SPECIAL_FLAGS[c];

  // 2) common single-country currency heuristics (extend as needed)
  // Map currency -> country when it’s a straightforward single country.
  const CCY_TO_COUNTRY: Record<string, string> = {
    // add more if you support them in your list
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

  // 3) unknown → globe
  return '🌐';
}
