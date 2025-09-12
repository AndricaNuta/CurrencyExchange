import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  fromCurrency: string;
  toCurrency: string;
  decimals: number;
}

const initialState: SettingsState = {
  fromCurrency: 'EUR',
  toCurrency: 'USD',
  decimals: 2,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFromCurrency: (s, a: PayloadAction<string>) => {
      s.fromCurrency = a.payload;
    },
    setToCurrency: (s, a: PayloadAction<string>) => {
      s.toCurrency = a.payload;
    },
    setDecimals: (s, a: PayloadAction<number>) => {
      s.decimals = a.payload;
    },
    swapCurrencies: s => {
      const t = s.fromCurrency;
      s.fromCurrency = s.toCurrency;
      s.toCurrency = t;
    },
  },
});

export const {
  setFromCurrency, setToCurrency, setDecimals, swapCurrencies
} =
  settingsSlice.actions;
export default settingsSlice.reducer;
