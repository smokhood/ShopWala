// i18n Configuration for DukandaR
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ur } from './ur';

// Export translation resources
export const resources = {
  en: { translation: en },
  ur: { translation: ur },
} as const;

// Get device locale
const getDeviceLocale = (): string => {
  const locale = Localization.getLocales()[0]?.languageCode || 'en';
  // If device is in Urdu/Hindi/Punjabi, default to Urdu
  if (['ur', 'hi', 'pa'].includes(locale)) {
    return 'ur';
  }
  return 'en';
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
});

// Export i18n instance
export default i18n;

// Re-export useTranslation hook
export { useTranslation } from 'react-i18next';

// Helper function to change language
export const changeLanguage = async (language: 'en' | 'ur'): Promise<void> => {
  await i18n.changeLanguage(language);
};

// Initialization function (i18n is initialized at module import time)
export const initI18n = async (): Promise<void> => {
  // i18n is already initialized when this module is imported
  // This function exists for explicit initialization/setup in the app root
  return Promise.resolve();
};

// Helper function to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Type-safe translation key type
export type TranslationKey = keyof typeof en;
