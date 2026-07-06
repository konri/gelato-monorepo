export const supportedLanguages = ["PL", "EN"] as const;

export type SupportedLanguageCode = (typeof supportedLanguages)[number];

export const isLanguageSupported = (
  language: string,
): language is SupportedLanguageCode =>
  supportedLanguages.some((code) => code === language);
