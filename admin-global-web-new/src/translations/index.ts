import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGUAGE_KEY } from '../lib/config'
import * as resources from './resources'

export const SUPPORTED_LANGUAGES = ['en', 'pl', 'ua'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

// Prefer the admin's saved choice, then the browser locale, then English.
function initialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY)?.toLowerCase()
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as Language
  }
  const browser = navigator.language?.slice(0, 2).toLowerCase()
  if (browser === 'uk') return 'ua' // navigator uses ISO "uk" for Ukrainian
  if (browser && (SUPPORTED_LANGUAGES as readonly string[]).includes(browser)) {
    return browser as Language
  }
  return 'en'
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: Object.entries(resources).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: { translation: value } }),
    {},
  ),
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

// Keep the stored preference in sync whenever the language changes.
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng)
})

export default i18n
