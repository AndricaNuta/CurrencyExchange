import { MMKV } from 'react-native-mmkv';
import type { Storage } from 'redux-persist';

export const mmkv = new MMKV({
  id: 'app-storage',
});

export const reduxStorage: Storage = {
  setItem: (key: string, value: string) => {
    mmkv.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = mmkv.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    mmkv.delete(key);
    return Promise.resolve();
  },
};
