// Hermes has no Intl.PluralRules: without this polyfill i18next falls back to
// a one/other rule and the Polish/Ukrainian _few/_many forms are never used.
// Must stay the first import (BRANDS_SPEC §5.8).
import 'intl-pluralrules'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as resources from './resources'

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    ...Object.entries(resources).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          translation: value,
        },
      }),
      {},
    ),
  },
  compatibilityJSON: 'v4',
  fallbackLng: 'en',
  interpolation: {
    // React Native already escapes output; i18next's HTML escaping would turn
    // characters like "/" in interpolated values into entities (e.g. &#x2F;).
    escapeValue: false,
  },
})

// The app's code for Ukrainian is `ua`; the CLDR plural rules live under `uk`.
type PluralResolverLike = { getRule: (code: string, options?: object) => unknown }
const pluralResolver = i18n.services.pluralResolver as unknown as PluralResolverLike | undefined
if (pluralResolver?.getRule) {
  const baseGetRule = pluralResolver.getRule.bind(pluralResolver)
  pluralResolver.getRule = (code, options) =>
    baseGetRule(/^ua(?:$|[-_])/i.test(code) ? 'uk' : code, options)
}

if (__DEV__) {
  const check = (lng: string, count: number, expected: string) => {
    // eslint-disable-next-line import/no-named-as-default-member
    const actual = i18n.t('Loyalty.pointsCount', { lng, count, formatted: String(count) })
    if (actual !== expected) {
      console.warn(`[i18n] plural check failed for ${lng}/${count}: "${actual}" !== "${expected}"`)
    }
  }
  check('pl', 5, '5 punktów')
  check('pl', 22, '22 punkty')
  check('ua', 22, '22 бали')
  check('ua', 11, '11 балів')
  check('en', 1, '1 point')
}

export default i18n
