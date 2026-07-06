import type { SupportedLanguageCode } from "@/constants/supportedLanguages";

export type AppLanguageCode = SupportedLanguageCode;

export type AppLanguageSelectorProps = {
  currentUpper: string;
  onSelectLanguage: (code: AppLanguageCode) => void;
};
