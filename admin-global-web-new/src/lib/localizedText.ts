/**
 * A text with its translations: the canonical text (`description`, shown when
 * there is no translation for the reader) plus `{ pl, en, ua }`
 * (`descriptionLocal`). Used by LocalizedTextFields.
 */
export type LocalizedValue = { canonical: string; pl: string; en: string; ua: string };

export const LOCALIZED_LANGS = ['pl', 'en', 'ua'] as const;
export type LocalizedLang = (typeof LOCALIZED_LANGS)[number];

export const EMPTY_LOCALIZED: LocalizedValue = { canonical: '', pl: '', en: '', ua: '' };

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Form value from the GraphQL pair (canonical + JSON translations). */
export function localizedFrom(canonical: string | null | undefined, local: unknown): LocalizedValue {
  const map = local && typeof local === 'object' && !Array.isArray(local) ? (local as Record<string, unknown>) : {};
  return { canonical: canonical ?? '', pl: str(map.pl), en: str(map.en), ua: str(map.ua) };
}

/** True when the canonical text or any translation has content. */
export function nonEmpty(value: LocalizedValue): boolean {
  return [value.canonical, value.pl, value.en, value.ua].some((s) => s.trim() !== '');
}

/**
 * GraphQL input pair: the canonical text (falls back to the first translation)
 * and the translations object (blank ones dropped). null = cleared.
 */
export function localizedToInput(value: LocalizedValue): {
  text: string | null;
  local: Partial<Record<LocalizedLang, string>> | null;
} {
  const local: Partial<Record<LocalizedLang, string>> = {};
  for (const lang of LOCALIZED_LANGS) {
    const text = value[lang].trim();
    if (text) local[lang] = text;
  }
  const canonical = value.canonical.trim() || local.pl || local.en || local.ua || '';
  return { text: canonical || null, local: Object.keys(local).length > 0 ? local : null };
}

/**
 * Form value for texts stored with every language filled in (rewards,
 * promotions): a translation equal to the canonical text is only the
 * fallback, so it shows as empty.
 */
export function localizedFromFilled(canonical: string | null | undefined, local: unknown): LocalizedValue {
  const value = localizedFrom(canonical, local);
  const base = value.canonical.trim();
  for (const lang of LOCALIZED_LANGS) {
    if (value[lang].trim() === base) value[lang] = '';
  }
  return value;
}

/**
 * GraphQL input pair with every language filled in: a missing translation
 * gets the canonical text, so the apps (which try the reader's language,
 * then English, then Polish) never show another language instead of it.
 * `local` is null when there is no text at all.
 */
export function localizedToFilledInput(value: LocalizedValue): {
  text: string | null;
  local: Record<LocalizedLang, string> | null;
} {
  const { text } = localizedToInput(value);
  if (!text) return { text: null, local: null };
  const local = { pl: text, en: text, ua: text };
  for (const lang of LOCALIZED_LANGS) {
    const translated = value[lang].trim();
    if (translated) local[lang] = translated;
  }
  return { text, local };
}

export function sameLocalized(a: LocalizedValue, b: LocalizedValue): boolean {
  return (['canonical', ...LOCALIZED_LANGS] as const).every((k) => a[k].trim() === b[k].trim());
}
