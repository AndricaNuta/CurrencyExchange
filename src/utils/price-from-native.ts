
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
