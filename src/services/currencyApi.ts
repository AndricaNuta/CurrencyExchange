import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../redux/store';

export type CurrencyMap = Record<string, string>;

export interface LatestResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export const currencyApi = createApi({
  reducerPath: 'currencyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.frankfurter.dev/v1/'
  }),
  endpoints: (builder) => ({
    getCurrencies: builder.query<CurrencyMap, void>({
      query: () => 'currencies',
    }),

    // Base table vs any base (we'll pass settings.defaultFrom)
    getBaseTable: builder.query<
      { base: string; date: string; rates: Record<string, number> },
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

    // Pair with same→same short-circuit + offline derivation from cached base table
    getPairRate: builder.query<
    { rate: number; date: string },
    { from: string; to: string }
  >({
    async queryFn(arg, api, _extra, baseQuery) {
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

      const state = api.getState() as RootState;
      const prefBase = (state.settings?.defaultFrom ?? 'USD').toUpperCase();

      // helper: fetch/resolve using a base table
      const withBase = async (base: string) => {
        try {
          const res = await api.dispatch(
            currencyApi.endpoints.getBaseTable.initiate({
              base
            })
          ).unwrap();
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

      // 1) try preferred base, then FROM, then TO
      for (const base of [prefBase, from, to]) {
        const derived = await withBase(base);
        if (derived) return {
          data: derived
        };
      }

      // 2) last resort: direct pair
      const direct = await baseQuery({
        url: `latest?base=${from}&symbols=${to}`
      });
      if (direct.error) return {
        error: direct.error as any
      };

      const body = direct.data as LatestResponse;
      const rate = body.rates?.[to];
      if (typeof rate !== 'number') return {
        error: {
          status: 500,
          data: 'Rate missing'
        } as any
      };
      return {
        data: {
          rate,
          date: body.date
        }
      };
    },
    keepUnusedDataFor: 60 * 5,
  }),
  }),
});

export const {
  useGetCurrenciesQuery,
  useGetBaseTableQuery,
  useGetPairRateQuery,
} = currencyApi;
