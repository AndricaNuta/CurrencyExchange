import { configureStore } from '@reduxjs/toolkit';
import {persistReducer, persistStore,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,} from 'redux-persist';
import { setupListeners } from '@reduxjs/toolkit/query';
import { currencyApi } from '../services/currencyApi';
import { reduxStorage } from '../services/mmkv';
import { rootReducer, type RootState } from './rootReducer';
import { widgetSyncMiddleware } from './middleware/widgetSyncMiddleware';

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['settings', 'ratesCache', 'favorites', currencyApi.reducerPath],
};

const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(currencyApi.middleware)
      .concat(widgetSyncMiddleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

// Types exported from the store (now safe; no cycles)
export type AppDispatch = typeof store.dispatch;
export type AppThunk = (dispatch: AppDispatch, getState: () => RootState) => void;
export type { RootState }; // re-export for convenience
