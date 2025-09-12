import * as RNLocalize from 'react-native-localize';

export type LanguageCode = 'en' | 'de' | 'fr' | 'es';
export const SUPPORTED: LanguageCode[] = ['en', 'de', 'fr', 'es'];
export const FALLBACK: LanguageCode = 'en';

export const normalizeToSupported = (tag?: string): LanguageCode => {
  const base = (tag ?? '').split('-')[0] as LanguageCode;
  return (SUPPORTED as readonly string[]).includes(base) ? base : FALLBACK;
};

export const detectDeviceLanguage = (): LanguageCode => {
  const locales = RNLocalize.getLocales();
  return normalizeToSupported(locales[0]?.languageCode);
};
