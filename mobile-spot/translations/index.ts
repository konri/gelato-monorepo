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

// Plural forms for Polish and Ukrainian (`_one/_few/_many/_other`). i18next
// asks Intl.PluralRules, which Hermes may not provide (then everything but 1
// is "other") and which does not know the app's language code "ua" (it falls
// back to English rules). These are the CLDR cardinal rules for pl and uk.
type PluralRule = { select: (n: number) => string; resolvedOptions: () => { pluralCategories: string[] } }
const SLAVIC_CATEGORIES = ['one', 'few', 'many', 'other']
const slavicRule = (isOne: (i: number) => boolean): PluralRule => ({
  select: (n) => {
    if (!Number.isInteger(n)) return 'other'
    const i = Math.abs(n)
    if (isOne(i)) return 'one'
    const m10 = i % 10
    const m100 = i % 100
    if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'few'
    return 'many'
  },
  resolvedOptions: () => ({ pluralCategories: [...SLAVIC_CATEGORIES] }),
})
const PLURAL_RULES: Record<string, PluralRule> = {
  pl: slavicRule((i) => i === 1),
  ua: slavicRule((i) => i % 10 === 1 && i % 100 !== 11),
}
const pluralResolver = i18n.services.pluralResolver
if (pluralResolver?.getRule) {
  const intlRule = pluralResolver.getRule.bind(pluralResolver)
  pluralResolver.getRule = (code: string, options: { ordinal?: boolean } = {}) =>
    (!options.ordinal && PLURAL_RULES[String(code).toLowerCase()]) || intlRule(code, options)
}

export default i18n
