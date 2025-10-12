import { combineReducers } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import historyReducer from './slices/historySlice';
import exchangeReducer from './slices/exchangeSlice';
import ratesCacheReducer from './slices/ratesCacheSlice';
import favoritesReducer from './slices/favoritesSlice';
import { currencyApi } from '../services/currencyApi';

export const rootReducer = combineReducers({
  settings: settingsReducer,
  history: historyReducer,
  exchange: exchangeReducer,
  ratesCache: ratesCacheReducer,
  favorites: favoritesReducer,
  [currencyApi.reducerPath]: currencyApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
