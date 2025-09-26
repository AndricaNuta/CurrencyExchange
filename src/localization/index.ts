import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {en, es, bg, ro} from './resources';
import {FALLBACK,
  detectDeviceLanguage,
  normalizeToSupported,
  LanguageCode,} from './languages';
import { loadStoredLanguage, persistLanguage } from './storage';

const initial: LanguageCode =
  loadStoredLanguage() ?? detectDeviceLanguage() ?? FALLBACK;

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en
    },
    es: {
      translation: es
    },
    bg: {
      translation: bg
    },
    ro: {
      translation: ro
    },
  },
  lng: initial,
  fallbackLng: FALLBACK,
  interpolation: {
    escapeValue: false
  },
});

const flag = '__persistHookAdded';
if (!(i18n as any)[flag]) {
  i18n.on('languageChanged', lng => {
    const code = normalizeToSupported(lng);
    persistLanguage(code);
  });
  (i18n as any)[flag] = true;
}

export default i18n;
