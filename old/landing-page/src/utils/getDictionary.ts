import plHome from '@/locales/pl/home.json';
import plSubscription from '@/locales/pl/subscription.json';
import plFeatures from '@/locales/pl/features.json';
import plAbout from '@/locales/pl/about.json';
import plDownload from '@/locales/pl/download.json';
import plFooter from '@/locales/pl/footer.json';
import plNavbar from '@/locales/pl/navbar.json';
import plContact from '@/locales/pl/contact.json';
import plCommon from '@/locales/pl/common.json';

import enHome from '@/locales/en/home.json';
import enSubscription from '@/locales/en/subscription.json';
import enFeatures from '@/locales/en/features.json';
import enAbout from '@/locales/en/about.json';
import enDownload from '@/locales/en/download.json';
import enFooter from '@/locales/en/footer.json';
import enNavbar from '@/locales/en/navbar.json';
import enContact from '@/locales/en/contact.json';
import enCommon from '@/locales/en/common.json';

import esHome from '@/locales/es/home.json';
import esSubscription from '@/locales/es/subscription.json';
import esFeatures from '@/locales/es/features.json';
import esAbout from '@/locales/es/about.json';
import esDownload from '@/locales/es/download.json';
import esFooter from '@/locales/es/footer.json';
import esNavbar from '@/locales/es/navbar.json';
import esContact from '@/locales/es/contact.json';

import deHome from '@/locales/de/home.json';
import deSubscription from '@/locales/de/subscription.json';
import deFeatures from '@/locales/de/features.json';
import deAbout from '@/locales/de/about.json';
import deDownload from '@/locales/de/download.json';
import deFooter from '@/locales/de/footer.json';
import deNavbar from '@/locales/de/navbar.json';
import deContact from '@/locales/de/contact.json';

import frHome from '@/locales/fr/home.json';
import frSubscription from '@/locales/fr/subscription.json';
import frFeatures from '@/locales/fr/features.json';
import frAbout from '@/locales/fr/about.json';
import frDownload from '@/locales/fr/download.json';
import frFooter from '@/locales/fr/footer.json';
import frNavbar from '@/locales/fr/navbar.json';
import frContact from '@/locales/fr/contact.json';

import itHome from '@/locales/it/home.json';
import itSubscription from '@/locales/it/subscription.json';
import itFeatures from '@/locales/it/features.json';
import itAbout from '@/locales/it/about.json';
import itDownload from '@/locales/it/download.json';
import itFooter from '@/locales/it/footer.json';
import itNavbar from '@/locales/it/navbar.json';
import itContact from '@/locales/it/contact.json';

import ruHome from '@/locales/ru/home.json';
import ruSubscription from '@/locales/ru/subscription.json';
import ruFeatures from '@/locales/ru/features.json';
import ruAbout from '@/locales/ru/about.json';
import ruDownload from '@/locales/ru/download.json';
import ruFooter from '@/locales/ru/footer.json';
import ruNavbar from '@/locales/ru/navbar.json';
import ruContact from '@/locales/ru/contact.json';

export type Locale = 'pl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'ru';
export type Namespace =
  | 'home'
  | 'subscription'
  | 'features'
  | 'about'
  | 'download'
  | 'footer'
  | 'navbar'
  | 'contact'
  | 'common';

export const LOCALES: Locale[] = ['pl', 'en', 'de', 'es', 'fr', 'it', 'ru'];

const dictionaries: Record<Locale, Record<Namespace, Record<string, unknown>>> = {
  pl: { home: plHome, subscription: plSubscription, features: plFeatures, about: plAbout, download: plDownload, footer: plFooter, navbar: plNavbar, contact: plContact, common: plCommon },
  en: { home: enHome, subscription: enSubscription, features: enFeatures, about: enAbout, download: enDownload, footer: enFooter, navbar: enNavbar, contact: enContact, common: enCommon },
  es: { home: esHome, subscription: esSubscription, features: esFeatures, about: esAbout, download: esDownload, footer: esFooter, navbar: esNavbar, contact: esContact, common: enCommon },
  de: { home: deHome, subscription: deSubscription, features: deFeatures, about: deAbout, download: deDownload, footer: deFooter, navbar: deNavbar, contact: deContact, common: enCommon },
  fr: { home: frHome, subscription: frSubscription, features: frFeatures, about: frAbout, download: frDownload, footer: frFooter, navbar: frNavbar, contact: frContact, common: enCommon },
  it: { home: itHome, subscription: itSubscription, features: itFeatures, about: itAbout, download: itDownload, footer: itFooter, navbar: itNavbar, contact: itContact, common: enCommon },
  ru: { home: ruHome, subscription: ruSubscription, features: ruFeatures, about: ruAbout, download: ruDownload, footer: ruFooter, navbar: ruNavbar, contact: ruContact, common: enCommon },
};

export function resolveLocale(value: string | undefined): Locale {
  const normalized = value?.split('-')[0];
  if (normalized && LOCALES.includes(normalized as Locale)) {
    return normalized as Locale;
  }
  return 'pl';
}

export function getTranslation(namespace: Namespace, locale: Locale) {
  const dict = dictionaries[locale]?.[namespace] || dictionaries.pl[namespace];

  function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: unknown = dict;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
        value,
      );
    }
    return value;
  }

  return { t, locale };
}
