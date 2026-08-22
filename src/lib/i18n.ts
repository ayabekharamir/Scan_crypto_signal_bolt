import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fa } from '@/locales/fa';
import { en } from '@/locales/en';

export const supportedLanguages = [
  { code: 'fa', label: 'فارسی', dir: 'rtl' as const },
  { code: 'en', label: 'English', dir: 'ltr' as const },
];

export const defaultLanguage = 'fa';

void i18n.use(initReactI18next).init({
  resources: {
    fa: { translation: fa },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function applyDocumentLocale(lang: string) {
  const langDef = supportedLanguages.find((l) => l.code === lang) ?? supportedLanguages[0];
  document.documentElement.lang = langDef.code;
  document.documentElement.dir = langDef.dir;
}

export default i18n;
