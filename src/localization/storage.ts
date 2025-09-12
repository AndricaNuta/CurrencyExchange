import { MMKV } from 'react-native-mmkv';
import { LanguageCode, SUPPORTED } from './languages';

const kv = new MMKV({ id: 'i18n' });
const KEY = 'language';

export const loadStoredLanguage = (): LanguageCode | undefined => {
  const v = kv.getString(KEY);
  return v && (SUPPORTED as readonly string[]).includes(v)
    ? (v as LanguageCode)
    : undefined;
};

export const persistLanguage = (code: LanguageCode) => {
  kv.set(KEY, code);
};
