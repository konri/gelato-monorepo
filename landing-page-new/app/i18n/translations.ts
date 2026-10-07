import pl from "../../public/locales/pl/common.json";
import en from "../../public/locales/en/common.json";
import ua from "../../public/locales/ua/common.json";

// Shared copy only. Page-specific namespaces (e.g. `business.json` for
// `/for-business`) are mounted by that route through `I18nNamespace`, so they
// do not ship with every page.

export const locales = ["pl", "en", "ua"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pl";

export const dictionaries = {
  pl,
  en,
  ua,
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
