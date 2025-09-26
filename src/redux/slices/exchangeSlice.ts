import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk, RootState } from '../store';

interface ExchangeState {
  from: string;
  to: string;
  initialized: boolean;
}

const initialState: ExchangeState = {
  from: 'EUR',
  to: 'USD',
  initialized: false,
};

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    setFrom: (s, a: PayloadAction<string>) => { s.from = a.payload; },
    setTo:   (s, a: PayloadAction<string>) => { s.to   = a.payload; },
    swap:    (s) => { const t = s.from; s.from = s.to; s.to = t; },
    markInitialized: (s) => { s.initialized = true; },
  },
});

export const {
  setFrom, setTo, swap, markInitialized
} = exchangeSlice.actions;
export default exchangeSlice.reducer;

export const resetToDefaults = (): AppThunk => (dispatch, getState:
     () => RootState) => {
  const {
    defaultFrom, defaultTo
  } = getState().settings;
  dispatch(setFrom(defaultFrom));
  dispatch(setTo(defaultTo));
  dispatch(markInitialized());
};
