import { useMemo } from 'react';

export function useSortedCurrencyList(map?: Record<string, string>) {
  return useMemo(
    () =>
      map
        ? Object.entries(map)
          .map(([code, name]) => ({
            code,
            name
          }))
          .sort((a, b) => a.code.localeCompare(b.code))
        : [],
    [map],
  );
}
