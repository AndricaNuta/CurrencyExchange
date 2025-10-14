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

