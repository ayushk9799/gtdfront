import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MMKV } from 'react-native-mmkv';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import de from './locales/de.json';

const storage = new MMKV();

// Helper to get system language using react-native-localize
const getDeviceLanguage = () => {
    try {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0) {
            return locales[0].languageCode;
        }
    } catch (error) {
        console.log('Error detecting language with react-native-localize:', error);
    }
    return 'en';
};

// Available languages in our app
const SUPPORTED_LANGUAGES = ['en', 'de'];

// 1. Get stored language. 
// 2. If no stored language, get device language.
// 3. Check if device language is in our SUPPORTED_LANGUAGES, if not fallback to 'en'.
const systemLang = getDeviceLanguage();
const defaultLang = SUPPORTED_LANGUAGES.includes(systemLang) ? systemLang : 'en';

const savedLang = storage.getString('appLanguage') || defaultLang;


i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // React Suspense is not supported in React Native
  react: { useSuspense: false },
});

/**
 * Change the app language. Persists to MMKV so it survives restarts.
 * @param {'en' | 'de'} lang
 */
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  storage.set('appLanguage', lang);
};

/**
 * Get the currently active language code.
 * @returns {'en' | 'de'}
 */
export const getLanguage = () => i18n.language || 'en';

export default i18n;
