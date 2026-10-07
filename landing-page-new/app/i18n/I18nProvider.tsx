"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  defaultLocale,
  locales,
  type Locale,
} from "./translations";

export type TParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "gelato-locale";

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}

/**
 * Slavic-style plural category for pl/ua. Falls back sensibly for en.
 * Returns "one" | "few" | "many" — matches the *.count_{one,few,many} keys.
 */
function pluralCategory(n: number): "one" | "few" | "many" {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "one";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "few";
  return "many";
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{{${name}}}`,
  );
}

export function resolve(
  dict: Record<string, unknown>,
  key: string,
  params?: TParams,
): string {
  // Pluralization: when a `count` param is present and no exact key exists,
  // try `${key}_${category}`.
  if (params && typeof params.count === "number" && lookup(dict, key) === undefined) {
    const plural = lookup(dict, `${key}_${pluralCategory(params.count)}`);
    if (plural !== undefined) return interpolate(plural, params);
  }
  const template = lookup(dict, key);
  if (template === undefined) return key;
  return interpolate(template, params);
}

/** Resolve `key` in `dicts[locale]`, falling back to `dicts.pl`, then to the key itself. */
function resolveWithFallback(
  dicts: Record<Locale, Record<string, unknown>>,
  locale: Locale,
  key: string,
  params?: TParams,
): string {
  const value = resolve(dicts[locale], key, params);
  return value === key && locale !== defaultLocale ? resolve(dicts[defaultLocale], key, params) : value;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && locales.includes(stored)) {
      setLocaleState(stored);
      return;
    }
    const browser = window.navigator.language.slice(0, 2).toLowerCase();
    const detected =
      browser === "uk" ? "ua" : (locales as readonly string[]).includes(browser)
        ? (browser as Locale)
        : defaultLocale;
    setLocaleState(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "ua" ? "uk" : locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  // A key missing in en/ua falls back to the Polish copy (the source
  // language) before the raw key is shown.
  const t = (key: string, params?: TParams) =>
    resolveWithFallback(dictionaries, locale, key, params);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

/**
 * Adds a page-specific namespace on top of the shared dictionaries, so its
 * copy ships only with the route that uses it (e.g. `business.json` on
 * `/for-business`). Inside, `t("<name>.x")` reads `dicts[locale].x` (with the
 * same Polish fallback); every other key goes to the parent `t`.
 */
export function I18nNamespace({
  name,
  dicts,
  children,
}: {
  name: string;
  dicts: Record<Locale, Record<string, unknown>>;
  children: ReactNode;
}) {
  const parent = useI18n();
  const prefix = `${name}.`;
  const value = useMemo<I18nContextValue>(() => {
    const scoped = Object.fromEntries(
      Object.entries(dicts).map(([l, d]) => [l, { [name]: d }]),
    ) as Record<Locale, Record<string, unknown>>;
    return {
      ...parent,
      t: (key, params) =>
        key.startsWith(prefix)
          ? resolveWithFallback(scoped, parent.locale, key, params)
          : parent.t(key, params),
    };
  }, [parent, name, prefix, dicts]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
