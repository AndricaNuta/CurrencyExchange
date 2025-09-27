import NetInfo from '@react-native-community/netinfo';
import { RootState } from '../redux/store';

export const derivePair = (
  s: RootState, from: string, to: string
): { rate: number | null; stale: boolean } => {
  if (from === to) return {
    rate: 1,
    stale: false
  };
  const {
    table, updatedAt
  } = s.ratesCache;
  if (!table) return {
    rate: null,
    stale: true
  };
  const bFrom = table[from], bTo = table[to];
  if (!bFrom || !bTo) return {
    rate: null,
    stale: true
  };
  const rate = bTo / bFrom;
  const stale =
                !updatedAt ||
                (Date.now() - updatedAt) > 1000 * 60 * 60 * 24; // >24h
  return {
    rate,
    stale
  };
};

export const isOnline = async () => (await NetInfo.fetch()).isConnected ?? true;
