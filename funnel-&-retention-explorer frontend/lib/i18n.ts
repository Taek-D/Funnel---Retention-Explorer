import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import koCommon from '../locales/ko/common.json';
import koPages from '../locales/ko/pages.json';
import koInsights from '../locales/ko/insights.json';
import enCommon from '../locales/en/common.json';
import enPages from '../locales/en/pages.json';
import enInsights from '../locales/en/insights.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { common: koCommon, pages: koPages, insights: koInsights },
      en: { common: enCommon, pages: enPages, insights: enInsights },
    },
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'pages', 'insights'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fre-language',
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.title = i18n.t('pages:meta.title');
  document.querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', lng === 'ko' ? 'ko_KR' : 'en_US');
});

export default i18n;
