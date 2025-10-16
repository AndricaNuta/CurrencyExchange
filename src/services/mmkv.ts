import { MMKV } from 'react-native-mmkv';
import type { Storage } from 'redux-persist';

export const storage = new MMKV({
  id: 'app-storage',
});

export const reduxStorage: Storage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};


export const setBool = (key: string, v: boolean) => storage.set(key, v ? 1 : 0);
export const getBool = (key: string) => storage.getNumber(key) === 1;

export const setNum = (key: string, n: number) => storage.set(key, n);
export const getNum = (key: string, fallback = 0) =>
  typeof storage.getNumber(key) === 'number' ? (storage.getNumber(key) as number) : fallback;

export const setStr = (key: string, v: string) => storage.set(key, v);
export const getStr = (key: string) => storage.getString(key) ?? undefined;

export const delKey = (key: string) => storage.delete(key);