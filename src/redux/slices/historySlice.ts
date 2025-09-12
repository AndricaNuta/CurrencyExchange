import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type HistoryItem = {
  id: string;
  when: number;
  source?: 'live' | 'camera' | 'gallery' | 'manual';
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
};

type HistoryState = { items: HistoryItem[]; max: number };
const initialState: HistoryState = {
  items: [],
  max: 200
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistory: (s, a: PayloadAction<Omit<HistoryItem, 'id' | 'when'>>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      s.items.unshift({
        ...a.payload,
        id,
        when: Date.now()
      });
      if (s.items.length > s.max) s.items.length = s.max;
    },
    clearHistory: s => {
      s.items = [];
    },
    removeHistory: (s, a: PayloadAction<string>) => {
      s.items = s.items.filter(i => i.id !== a.payload);
    },
  },
});

export const {
  addHistory, clearHistory, removeHistory
} = historySlice.actions;
export default historySlice.reducer;
