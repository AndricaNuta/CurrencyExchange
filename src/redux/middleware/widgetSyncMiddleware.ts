import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer'; // ← import here, not from store
import { reloadWidgetTimelines, saveFavoritesToWidget } from '../../native/SharedRates';
import {toggleFavorite,
  updateFavoriteRate,
  setAlerts,
  resetPctBaseline,
  acknowledgeNotified,} from '../slices/favoritesSlice';
import { REHYDRATE } from 'redux-persist';
import { NativeModules } from 'react-native';
const {
  CurrenseeSharedRates, CurrenseeWidgetReload
} = NativeModules;
// Optional tiny debounce to avoid spamming writes
let timer: any;

export const widgetSyncMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  const watched = new Set([
    toggleFavorite.type,
    updateFavoriteRate.type,
    setAlerts.type,
    resetPctBaseline.type,
    acknowledgeNotified.type,
    REHYDRATE,                                         // ← include it here
  ]);

  if (watched.has(action.type)) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const state = store.getState();
      const items = Object.values(state.favorites.items);

      const pairs = items
      // keep the favorites you want to show; no rate filter
        .map(i => ({
          from: i.base,
          to: i.quote,
          // prefer a known spot, fall back to 0 if absent
          rate:
          typeof (i as any).lastRate === 'number' ? (i as any).lastRate :
            typeof i.alerts?.lastRate === 'number' ? i.alerts!.lastRate :
              0,
          updatedAt: new Date().toISOString(),
        }))
        .slice(0, 4);
      console.log("pairs",pairs);
      saveFavoritesToWidget(pairs);
      CurrenseeSharedRates?.readFavoritesCount?.()
        .then(c => console.log('widget favorites count after save:', c))
        .catch(e => console.warn('readFavoritesCount failed:', e));
      reloadWidgetTimelines();

    }, 150);
  }

  return result;
};
