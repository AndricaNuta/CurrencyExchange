import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,} from 'redux-persist';
import { setupListeners } from '@reduxjs/toolkit/query';
import settingsReducer from './slices/settingsSlice';
import historyReducer from './slices/historySlice';
import { currencyApi } from '../services/currencyApi';
import { reduxStorage } from '../services/mmkv';

const rootReducer = combineReducers({
  settings: settingsReducer,
  history: historyReducer,
  [currencyApi.reducerPath]: currencyApi.reducer,
});

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['settings', 'history', currencyApi.reducerPath],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefault =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(currencyApi.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
