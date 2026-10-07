import i18n from '../translations';

/** Intl locale for the console language. */
export function uiLocale(): string {
  const lng = i18n.language?.slice(0, 2).toLowerCase();
  if (lng === 'pl') return 'pl-PL';
  if (lng === 'ua' || lng === 'uk') return 'uk-UA';
  return 'en-GB';
}

/** UI language key for `{ pl, en, ua }` objects. */
export function uiLangKey(): 'pl' | 'en' | 'ua' {
  const lng = i18n.language?.slice(0, 2).toLowerCase();
  if (lng === 'pl') return 'pl';
  if (lng === 'ua' || lng === 'uk') return 'ua';
  return 'en';
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(uiLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(uiLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtMoney(value: number): string {
  return new Intl.NumberFormat(uiLocale(), { style: 'currency', currency: 'PLN' }).format(value);
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat(uiLocale()).format(value);
}

/** A `{ pl, en, ua }` JSON value in the UI language, else `fallback`. */
export function localized(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const text = (value as Record<string, unknown>)[uiLangKey()];
    if (typeof text === 'string' && text.trim()) return text;
  }
  return fallback;
}

/** City name in the UI language (City.nameLocal), else its canonical name. */
export function cityName(city: { name: string; nameLocal?: unknown } | null | undefined): string {
  if (!city) return '';
  return localized(city.nameLocal, city.name);
}

/** An ISO instant as the value of an `<input type="date">` (browser's local date). */
export function dateInputFromIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Start (00:00:00.000) or end (23:59:59.999) of a date input's day in the browser's zone, as ISO. */
export function isoFromDateInput(value: string, edge: 'start' | 'end'): string | null {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = edge === 'start' ? new Date(y, m - 1, d, 0, 0, 0, 0) : new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
