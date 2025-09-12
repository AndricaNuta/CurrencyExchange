import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  defaultFrom: string;
  defaultTo: string;
  decimals: number;
}

const initialState: SettingsState = {
  defaultFrom: 'EUR',
  defaultTo: 'USD',
  decimals: 2,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDefaultFrom: (s, a: PayloadAction<string>) => {
      s.defaultFrom = a.payload;
    },
    setDefaultTo:   (s, a: PayloadAction<string>) => {
      s.defaultTo   = a.payload;
    },
    setDecimals:    (s, a: PayloadAction<number>) => {
      s.decimals    = a.payload;
    },
  },
});

export const {
  setDefaultFrom,
  setDefaultTo,
  setDecimals
} = settingsSlice.actions;
export default settingsSlice.reducer;
