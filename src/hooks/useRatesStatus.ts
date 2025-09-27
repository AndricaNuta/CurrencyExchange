import { useSelector } from 'react-redux';
import { currencyApi } from '../services/currencyApi';
import type { RootState } from '../redux/store';

export function useRatesStatus(base: string | undefined) {
  const sel = currencyApi.endpoints.getBaseTable.select({
    base: (base ?? '').toUpperCase()
  } as any);
  const {
    data
  } = useSelector((s: RootState) => sel(s) ?? {});

  if (!data?.date) return {
    hasBase: false,
    staleHours: null as number | null,
    lastDate: null as string | null
  };

  const lastDate = data.date;
  const last = new Date(`${lastDate}T00:00:00Z`).getTime();
  const now = Date.now();
  const staleHours = (now - last) / (1000 * 60 * 60);

  return {
    hasBase: true,
    staleHours,
    lastDate
  };
}
