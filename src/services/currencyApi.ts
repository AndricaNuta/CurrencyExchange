import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  endpoints: builder => ({
    getCurrencies: builder.query<CurrencyMap, void>({
      query: () => 'currencies',
    }),
    getPairRate: builder.query<
      { rate: number; date: string },
      { from: string; to: string }
    >({
      query: ({
        from, to
      }) => `latest?base=${from}&symbols=${to}`,
      transformResponse: (res: LatestResponse, _meta, arg) => {
        const rate = arg.from === arg.to ? 1 : res.rates[arg.to];
        return {
          rate,
          date: res.date
        };
      },
    }),
  }),
});

export const {
  useGetCurrenciesQuery, useGetPairRateQuery
} = currencyApi;
