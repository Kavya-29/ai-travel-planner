import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import fr from './locales/fr.json';
import ml from './locales/ml.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ta: { translation: ta },
            hi: { translation: hi },
            fr: { translation: fr },
            ml: { translation: ml },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
