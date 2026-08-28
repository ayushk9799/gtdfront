import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MMKV } from 'react-native-mmkv';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

const storage = new MMKV();

// Helper to get system language using react-native-localize
const getDeviceLanguage = () => {
    try {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0) {
            return locales[0].languageCode;
        }
    } catch (error) {
        // console.log('Error detecting language with react-native-localize:', error);
    }
    return 'en';
};

// Available languages in our app
const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'ru', 'ja', 'ko'];

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
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    ru: { translation: ru },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // React Suspense is not supported in React Native
  react: { useSuspense: false },
});

/**
 * Change the app language. Persists to MMKV so it survives restarts.
 * @param {'en' | 'de' | 'fr' | 'es' | 'it' | 'ru' | 'ja' | 'ko'} lang
 */
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  storage.set('appLanguage', lang);
};

/**
 * Get the currently active language code.
 * @returns {'en' | 'de' | 'fr' | 'es' | 'it' | 'ru' | 'ja' | 'ko'}
 */
export const getLanguage = () => i18n.language || 'en';

export default i18n;
