import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { detectLocale, setStoredLocale, supportedLngs } from './locale';
import { resources } from './resources';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLocale(),
    supportedLngs,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
  });

  i18n.on('languageChanged', language => {
    document.documentElement.lang = language;

    if (language === 'en' || language === 'zh-CN') {
      setStoredLocale(language);
      return;
    }

    setStoredLocale('en');
  });
}

document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';

export default i18n;
