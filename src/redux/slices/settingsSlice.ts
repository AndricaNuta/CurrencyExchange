import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemePreference = 'light' | 'dark';

interface SettingsState {
  defaultFrom: string;
  defaultTo: string;
  decimals: number;
  themePreference: ThemePreference;
}

const initialState: SettingsState = {
  defaultFrom: 'EUR',
  defaultTo: 'USD',
  decimals: 2,
  themePreference: 'light',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDefaultFrom:
    (s, a: PayloadAction<string>) => {
      s.defaultFrom = a.payload;
    },
    setDefaultTo:
    (s, a: PayloadAction<string>) => {
      s.defaultTo   = a.payload;
    },
    setDecimals:
     (s, a: PayloadAction<number>) => {
       s.decimals    = a.payload;
     },
    setThemePreference:
    (s, a: PayloadAction<ThemePreference>) => {
      s.themePreference = a.payload;
    },
  },
});

export const {
  setDefaultFrom, setDefaultTo, setDecimals, setThemePreference
} = settingsSlice.actions;
export default settingsSlice.reducer;
