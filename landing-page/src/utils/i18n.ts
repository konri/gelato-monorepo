// src/lib/i18n.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18n as i18nConfig } from '../../next-i18next.config.mjs';

// Import translations
import plNavbar from '../locales/pl/navbar.json';
import plHome from '../locales/pl/home.json';
import plFooter from '../locales/pl/footer.json';
import plDownload from '../locales/pl/download.json';
import plSubscription from '../locales/pl/subscription.json';
import plFeatures from '../locales/pl/features.json';
import plAbout from '../locales/pl/about.json';
import plContact from '../locales/pl/contact.json';

import enNavbar from '../locales/en/navbar.json';
import enHome from '../locales/en/home.json';
import enFooter from '../locales/en/footer.json';
import enDownload from '../locales/en/download.json';
import enSubscription from '../locales/en/subscription.json';
import enFeatures from '../locales/en/features.json';
import enAbout from '../locales/en/about.json';
import enContact from '../locales/en/contact.json';

import esNavbar from '../locales/es/navbar.json';
import esHome from '../locales/es/home.json';
import esFooter from '../locales/es/footer.json';
import esDownload from '../locales/es/download.json';
import esSubscription from '../locales/es/subscription.json';
import esFeatures from '../locales/es/features.json';
import esAbout from '../locales/es/about.json';
import esContact from '../locales/es/contact.json';

import itNavbar from '../locales/it/navbar.json';
import itHome from '../locales/it/home.json';
import itFooter from '../locales/it/footer.json';
import itDownload from '../locales/it/download.json';
import itSubscription from '../locales/it/subscription.json';
import itFeatures from '../locales/it/features.json';
import itAbout from '../locales/it/about.json';
import itContact from '../locales/it/contact.json';

import frNavbar from '../locales/fr/navbar.json';
import frHome from '../locales/fr/home.json';
import frFooter from '../locales/fr/footer.json';
import frDownload from '../locales/fr/download.json';
import frSubscription from '../locales/fr/subscription.json';
import frFeatures from '../locales/fr/features.json';
import frAbout from '../locales/fr/about.json';
import frContact from '../locales/fr/contact.json';

import deNavbar from '../locales/de/navbar.json';
import deHome from '../locales/de/home.json';
import deFooter from '../locales/de/footer.json';
import deDownload from '../locales/de/download.json';
import deSubscription from '../locales/de/subscription.json';
import deFeatures from '../locales/de/features.json';
import deAbout from '../locales/de/about.json';
import deContact from '../locales/de/contact.json';

import ruNavbar from '../locales/ru/navbar.json';
import ruHome from '../locales/ru/home.json';
import ruFooter from '../locales/ru/footer.json';
import ruDownload from '../locales/ru/download.json';
import ruSubscription from '../locales/ru/subscription.json';
import ruFeatures from '../locales/ru/features.json';
import ruAbout from '../locales/ru/about.json';
import ruContact from '../locales/ru/contact.json';

const resources = {
  pl: {
    navbar: plNavbar,
    home: plHome,
    footer: plFooter,
    download: plDownload,
    subscription: plSubscription,
    features: plFeatures,
    about: plAbout,
    contact: plContact,
  },
  en: {
    navbar: enNavbar,
    home: enHome,
    footer: enFooter,
    download: enDownload,
    subscription: enSubscription,
    features: enFeatures,
    about: enAbout,
    contact: enContact,
  },
  es: {
    navbar: esNavbar,
    home: esHome,
    footer: esFooter,
    download: esDownload,
    subscription: esSubscription,
    features: esFeatures,
    about: esAbout,
    contact: esContact,
  },
  it: {
    navbar: itNavbar,
    home: itHome,
    footer: itFooter,
    download: itDownload,
    subscription: itSubscription,
    features: itFeatures,
    about: itAbout,
    contact: itContact,
  },
  fr: {
    navbar: frNavbar,
    home: frHome,
    footer: frFooter,
    download: frDownload,
    subscription: frSubscription,
    features: frFeatures,
    about: frAbout,
    contact: frContact,
  },
  de: {
    navbar: deNavbar,
    home: deHome,
    footer: deFooter,
    download: deDownload,
    subscription: deSubscription,
    features: deFeatures,
    about: deAbout,
    contact: deContact,
  },
  ru: {
    navbar: ruNavbar,
    home: ruHome,
    footer: ruFooter,
    download: ruDownload,
    subscription: ruSubscription,
    features: ruFeatures,
    about: ruAbout,
    contact: ruContact,
  },
};

// Bezpieczny dostęp do localStorage
const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'pl';
  }

  try {
    const cookieLocale = document.cookie.match(/locale=([^;]+)/)?.[1];
    return localStorage.getItem('i18nextLng') || cookieLocale || 'pl';
  } catch {
    return 'pl';
  }
};

const i18n = createInstance();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;