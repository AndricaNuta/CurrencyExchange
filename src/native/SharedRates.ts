import { NativeModules } from 'react-native';
const {
  CurrenseeSharedRates, CurrenseeWidgetReload
} = NativeModules;

export type FavoritePair = {
  from: string;
  to: string;
  rate: number;
  updatedAt: string; // ISO
};

export function saveFavoritesToWidget(pairs: FavoritePair[]) {
  try {
    CurrenseeSharedRates?.saveFavorites?.(JSON.stringify(pairs));
  } catch (e) {
    console.log('saveFavoritesToWidget error', e);
  }
}

export const reloadWidgetTimelines = () => {
  try { CurrenseeWidgetReload?.reload?.(); } catch {}
};

console.log('NM has CurrenseeSharedRates?', !!CurrenseeSharedRates);
console.log('NM has CurrenseeWidgetReload?', !!CurrenseeWidgetReload);

// Option A: IIFE
(async () => {
  try {
    const count = await CurrenseeSharedRates?.readFavoritesCount?.();
    console.log('widget favorites count:', count);
  } catch (e) {
    console.warn('readFavoritesCount failed:', e);
  }
})();

// Option B: .then()
// CurrenseeSharedRates?.readFavoritesCount?.()
//   .then(c => console.log('widget favorites count:', c))
//   .catch(e => console.warn('readFavoritesCount failed:', e));
