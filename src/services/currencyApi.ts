import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../redux/store';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type CurrencyMap = Record<string, string>;
export type HistoryPoint = { date: string; rate: number };

export interface LatestResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

type PairRate = { rate: number; date: string };
type PairArg  = { from: string; to: string };
type HistoryArgs = {
  from: string;
  to: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
};

// Convenience for queryFn return
type QueryOk<T>  = { data: T };
type QueryErr    = { error: FetchBaseQueryError };

export const currencyApi = createApi({
  reducerPath: 'currencyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.frankfurter.dev/v1/'
  }),
  endpoints: (builder) => ({
    getCurrencies: builder.query<CurrencyMap, void>({
      query: () => 'currencies',
    }),

    getBaseTable: builder.query<
      { base: string; date: string; rates: Record<string,number> },
      { base: string }
    >({
      query: ({
        base
      }) => `latest?base=${base}`,
      transformResponse: (res: LatestResponse) => ({
        base: res.base,
        date: res.date,
        rates: {
          [res.base]: 1,
          ...res.rates
        },
      }),
      keepUnusedDataFor: 60 * 10,
    }),

    // -------- Pair rate with explicit queryFn typing --------
    getPairRate: builder.query<PairRate, PairArg>({
      async queryFn(arg, api, _extra, baseQuery):
      Promise<QueryOk<PairRate> | QueryErr> {
        const from = arg.from.toUpperCase();
        const to   = arg.to.toUpperCase();

        if (from === to) {
          const today = new Date().toISOString().slice(0, 10);
          return {
            data: {
              rate: 1,
              date: today
            }
          };
        }

        const state    = api.getState() as RootState;
        const prefBase = (state.settings?.defaultFrom ?? 'USD').toUpperCase();

        const withBase = async (base: string): Promise<PairRate | null> => {
          try {
            const res = await api
              .dispatch(currencyApi.endpoints.getBaseTable.initiate({
                base
              }))
              .unwrap();
            const rFrom = res.rates[from];
            const rTo   = res.rates[to];
            if (rFrom && rTo) return {
              rate: rTo / rFrom,
              date: res.date
            };
          } catch {}
          const sel = currencyApi.endpoints.getBaseTable.select({
            base
          });
          const cached = sel(state)?.data;
          if (cached?.rates) {
            const rFrom = cached.rates[from];
            const rTo   = cached.rates[to];
            if (rFrom && rTo) return {
              rate: rTo / rFrom,
              date: cached.date
            };
          }
          return null;
        };

        for (const base of [prefBase, from, to]) {
          const derived = await withBase(base);
          if (derived) return {
            data: derived
          };
        }

        const direct = await baseQuery({
          url: `latest?base=${from}&symbols=${to}`
        });
        if ('error' in direct && direct.error) {
          return {
            error: direct.error as FetchBaseQueryError
          };
        }

        const body = direct.data as LatestResponse;
        const rate = body.rates?.[to];
        if (typeof rate !== 'number') {
          return {
            error: {
              status: 500,
              data: 'Rate missing'
            } as FetchBaseQueryError
          };
        }
        return {
          data: {
            rate,
            date: body.date
          }
        };
      },
      keepUnusedDataFor: 60 * 5,
    }),
    getHistoryRange: builder.query<HistoryPoint[], HistoryArgs>({
      query: ({
        from, to, start, end
      }) =>
        `${start}..${end}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      transformResponse: (resp: {
        rates: Record<string, Record<string, number>> }, _meta, arg) => {
        const rates = resp?.rates ?? {};
        const points = Object.keys(rates)
          .sort() // ascending by date
          .map((d) => ({
            date: d,
            rate: Number(rates[d]?.[arg.to]),
          }))
          .filter((p) => Number.isFinite(p.rate));
        return points;
      },
      keepUnusedDataFor: 60 * 30, // cache 30min
    }),
  }),


});

export const {
  useGetCurrenciesQuery,
  useGetBaseTableQuery,
  useGetPairRateQuery,
  useGetHistoryRangeQuery
} = currencyApi;
