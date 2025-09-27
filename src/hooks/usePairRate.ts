import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { currencyApi } from '../services/currencyApi';
import { derivePair, isOnline } from '../utils/offlineRate';
import { useEffect, useMemo, useState } from 'react';

export const usePairRate = (from: string, to: string) => {
  const s = useSelector((st: RootState) => st);
  const [{
    rate, stale: derivedStale
  }, setDerived] = useState({
    rate: null as number | null,
    stale: true
  });

  const {
    data, isFetching
  } = currencyApi.useGetBaseTableQuery({
    base: 'USD'
  }, {
    skip: false
  });

  useEffect(() => {
    setDerived(derivePair(s, from, to));
  }, [s.ratesCache, from, to, s]);

  const effectiveRate = useMemo(() => {
    if (from === to) return 1;
    return rate ?? null;
  }, [rate, from, to]);

  const stale = derivedStale || !data;

  return {
    rate: effectiveRate,
    isFetching,
    stale
  };
};
