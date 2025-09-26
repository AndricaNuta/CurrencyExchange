import * as RNLocalize from 'react-native-localize';

export type LanguageCode =
  | 'en' | 'af' | 'sq' | 'ar' | 'hy' | 'az' | 'be' | 'bn' | 'bs'
  | 'bg' | 'my' | 'ca' | 'zh' | 'zh-Hans' | 'zh-Hant' | 'hr' | 'cs' | 'da'
  | 'nl' | 'et' | 'fi' | 'fr' | 'ka' | 'de' | 'el' | 'gu' | 'iw' | 'hi'
  | 'hu' | 'is' | 'id' | 'it' | 'ja' | 'kn' | 'kk' | 'ko' | 'ky' | 'lo'
  | 'lv' | 'lt' | 'mk' | 'ms' | 'ml' | 'mt' | 'mn' | 'mr' | 'ne' | 'fa'
  | 'pl' | 'pt' | 'pa' | 'ro' | 'ru' | 'sr' | 'si' | 'sk' | 'sl' | 'es'
  | 'sw' | 'sv' | 'ta' | 'te' | 'th' | 'tr' | 'uk' | 'ur' | 'uz' | 'vi';

export const SUPPORTED: LanguageCode[] = [
  'en','af','sq','ar','hy','az','be','bn','bs',
  'bg','my','ca','zh','zh-Hans','zh-Hant','hr','cs','da',
  'nl','et','fi','fr','ka','de','el','gu','iw','hi',
  'hu','is','id','it','ja','kn','kk','ko','ky','lo',
  'lv','lt','mk','ms','ml','mt','mn','mr','ne','fa',
  'pl','pt','pa','ro','ru','sr','si','sk','sl','es',
  'sw','sv','ta','te','th','tr','uk','ur','uz','vi'
];

export const FALLBACK: LanguageCode = 'en';
export const normalizeToSupported = (tag?: string): LanguageCode => {
  const base = (tag ?? '').split('-')[0] as LanguageCode;
  return (SUPPORTED as readonly string[]).includes(base) ? base : FALLBACK;
};

export const detectDeviceLanguage = (): LanguageCode => {
  const locales = RNLocalize.getLocales();
  return normalizeToSupported(locales[0]?.languageCode);
};
