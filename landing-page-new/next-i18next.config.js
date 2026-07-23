module.exports = {
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en', 'ua'],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
