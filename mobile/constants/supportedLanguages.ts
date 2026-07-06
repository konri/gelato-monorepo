export const supportedLanguages = ['EN', 'PL', 'UA']

export const isLanguageSupported = (language: string): boolean => {
  return supportedLanguages.includes(language)
}
