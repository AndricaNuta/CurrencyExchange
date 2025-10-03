import type { OCRPrice } from '../types/PriceOCR';

export function getDetectedCurrency(
  p: OCRPrice,
  parsedFallback: string | undefined,
  fromFallback: string
) {
  return (p.currencyCode ??
          (p as any).rawCurrency ??
          parsedFallback ??
          (p as any).currencyDefault ??
          fromFallback).toUpperCase();
}
