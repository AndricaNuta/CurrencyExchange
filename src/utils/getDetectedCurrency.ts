export function getDetectedCurrency(
  p: { currencyCode?: string },
  parsed?: string,
  fallback?: string
) {
  return (p.currencyCode || parsed || fallback || '').toUpperCase();
}