import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type BaseRates = Record<string, number>;
type RatesCacheState = {
  base: string;
  table: BaseRates | null;
  updatedAt: number | null; // ms
};
const initialState: RatesCacheState = {
  base: 'USD',
  table: null,
  updatedAt: null
};

export const ratesCacheSlice = createSlice({
  name: 'ratesCache',
  initialState,
  reducers: {
    setRates(state, action: PayloadAction<{
        base: string;
        table: BaseRates;
        ts: number }>) {
      state.base = action.payload.base;
      state.table = action.payload.table;
      state.updatedAt = action.payload.ts;
    },
    clearRates(state) { state.table = null; state.updatedAt = null; },
  }
});
export const {
  setRates, clearRates
} = ratesCacheSlice.actions;
export default ratesCacheSlice.reducer;
