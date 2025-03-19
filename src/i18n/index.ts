
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Create i18n instance
i18n
  // Load translations from /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug mode in development
    debug: import.meta.env.DEV,
    // Detect and cache language on localStorage
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    // Namespaces
    ns: ['common', 'auth', 'dashboard', 'settings', 'integrations', 'projects', 'adwizard'],
    defaultNS: 'common',
    // React settings
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Language configuration
    supportedLngs: ['en', 'es', 'nl', 'fr', 'de'],
    // RTL languages support
    preload: ['en', 'es', 'nl'],
  });

export default i18n;
