import pl from "../../public/locales/pl/common.json";
import en from "../../public/locales/en/common.json";
import ua from "../../public/locales/ua/common.json";

export const locales = ["pl", "en", "ua"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pl";

export const dictionaries = { pl, en, ua } as const;

export type Dictionary = (typeof dictionaries)[Locale];
