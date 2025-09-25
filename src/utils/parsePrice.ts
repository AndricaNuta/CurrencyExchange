const ISO_RE = /\b(USD|CAD|EUR|GBP|RON|LEI|AUD|NZD|CHF|JPY)\b/i;
const SYM_RE = /[$€£]/;

export function parsePrice(nativeText: string, fallbackISO: string) {
  const iso = nativeText.match(ISO_RE)?.[1]?.toUpperCase();
  const hasSymbol = SYM_RE.test(nativeText);
  const currency = iso ?? (hasSymbol ? fallbackISO.toUpperCase() : undefined);

  const amountRaw = nativeText.replace(/[^\d.,-]/g, '');
  const value =
    Number(
      amountRaw
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(/,(?=\d{3}(\D|$))/g, '')
        .replace(',', '.')
    ) || 0;

  return {
    currency,
    amountRaw,
    value
  };

}
