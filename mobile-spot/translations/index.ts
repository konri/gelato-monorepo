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

export default i18n
