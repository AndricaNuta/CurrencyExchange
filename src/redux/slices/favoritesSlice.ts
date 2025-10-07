import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Alerts, FavoritePair } from '../../types/favorites';

type FavoritesState = {
  items: Record<string, FavoritePair>;
};

const initialAlerts = (): Alerts => ({
  onChangePct: null,
  above: null,
  below: null,
  notifyOncePerCross: true,
  quietHours: null,
  minIntervalMinutes: 60,
  lastNotifiedAt: null,
  lastBaseline: null,
  lastRate: null,
});

const idOf = (base: string, quote: string) => `${base}-${quote}`;

const initialState: FavoritesState = {
  items: {}
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<{ base: string; quote: string }>) => {
      const {
        base, quote
      } = action.payload;
      const id = idOf(base, quote);
      if (state.items[id]) {
        delete state.items[id];
      } else {
        state.items[id] = {
          id,
          base,
          quote,
          alerts: initialAlerts()
        };
      }
    },
    setAlerts: (state, action: PayloadAction<{ base: string; quote: string; alerts: Partial<Alerts> }>) => {
      const {
        base, quote, alerts
      } = action.payload;
      const id = idOf(base, quote);
      if (!state.items[id]) state.items[id] = {
        id,
        base,
        quote,
        alerts: initialAlerts()
      };
      state.items[id].alerts = {
        ...state.items[id].alerts,
        ...alerts
      };
    },
    updateFavoriteRate: (state, action: PayloadAction<{ base: string; quote: string; rate: number }>) => {
      const {
        base, quote, rate
      } = action.payload;
      const id = idOf(base, quote);
      const item = state.items[id];
      if (!item) return;
      item.alerts.lastRate = rate;
      if (item.alerts.lastBaseline == null) item.alerts.lastBaseline = rate;
    },
    resetPctBaseline: (state, action: PayloadAction<{ base: string; quote: string }>) => {
      const {
        base, quote
      } = action.payload;
      const id = idOf(base, quote);
      const item = state.items[id];
      if (!item) return;
      item.alerts.lastBaseline = item.alerts.lastRate ?? null;
    },
    acknowledgeNotified: (state, action: PayloadAction<{ base: string; quote: string; when?: string }>) => {
      const {
        base, quote, when
      } = action.payload;
      const id = idOf(base, quote);
      const item = state.items[id];
      if (!item) return;
      item.alerts.lastNotifiedAt = when ?? new Date().toISOString();
    },
  },
});

export const {
  toggleFavorite,
  setAlerts,
  updateFavoriteRate,
  resetPctBaseline,
  acknowledgeNotified,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
