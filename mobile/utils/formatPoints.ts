import i18n from 'i18next';
import type { TFunction } from 'i18next';

/** The app uses `ua` for Ukrainian; Intl / CLDR use `uk`. */
export const intlLocale = (lang?: string | null): string => {
  const code = (lang || i18n.language || 'en').split('-')[0].toLowerCase();
  return code === 'ua' ? 'uk' : code;
};

/** 1250 → "1250" / "1,250" / "1 250" depending on the language. */
export const formatNumber = (n: number, lang?: string | null): string => {
  try {
    return new Intl.NumberFormat(intlLocale(lang)).format(n);
  } catch {
    return String(n);
  }
};

/**
 * "1 punkt", "2 punkty", "5 punktów"; "1 бал", "22 бали"; "1 point", "2 points".
 * Long sentences take this pre-pluralised text as `{{pointsText}}`.
 */
export const pointsText = (t: TFunction, n: number, lang?: string | null): string =>
  t('Loyalty.pointsCount', { count: n, formatted: formatNumber(n, lang) });

/** Time of day ("14:00") in an IANA zone; falls back to the device zone. */
export const formatTimeInZone = (iso: string, timeZone?: string | null, lang?: string | null): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), timeZone ? { ...options, timeZone } : options).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(intlLocale(lang), options).format(date);
    } catch {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  }
};

/** Short weekday + time ("Thu 10:00") in an IANA zone. */
export const formatDayTimeInZone = (
  iso: string,
  timeZone?: string | null,
  lang?: string | null,
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), timeZone ? { ...options, timeZone } : options).format(date);
  } catch {
    return formatTimeInZone(iso, timeZone, lang);
  }
};
