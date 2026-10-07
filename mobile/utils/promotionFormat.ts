import type { BrandPromotionWindow } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { intlLocale } from '@/utils/formatPoints';

/**
 * Promotion schedules as stored (BRANDS_SPEC §5.6): windows are "HH:MM" in the
 * promotion's own time zone, so they are shown verbatim ("Thu 10:00–14:00"),
 * never converted to the device zone.
 */

// 2024-01-01 is a Monday: ISO day d (1 = Mon … 7 = Sun) is Jan d.
const weekdayName = (day: number, lang: string, style: 'short' | 'long' = 'short'): string => {
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), { weekday: style, timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, 0, day, 12)),
    );
  } catch {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1] ?? String(day);
  }
};

/** [1,2,3,5] → "Mon–Wed, Fri". */
const dayRanges = (days: number[], lang: string): string => {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
    const from = weekdayName(sorted[i], lang);
    parts.push(j - i >= 2 ? `${from}–${weekdayName(sorted[j], lang)}` : j > i ? `${from}, ${weekdayName(sorted[j], lang)}` : from);
    i = j + 1;
  }
  return parts.join(', ');
};

/**
 * One line per distinct time range: "Mon–Fri 10:00–14:00". `everyDay` is the
 * localized "Every day" used when a range covers all seven days.
 */
export const formatWindows = (windows: BrandPromotionWindow[], lang: string, everyDay: string): string[] => {
  const byRange = new Map<string, number[]>();
  for (const w of windows) {
    const key = `${w.startTime}–${w.endTime}`;
    byRange.set(key, [...(byRange.get(key) ?? []), w.dayOfWeek]);
  }
  return [...byRange.entries()].map(([range, days]) => {
    const unique = new Set(days);
    const label = unique.size === 7 ? everyDay : dayRanges(days, lang);
    return `${label} ${range}`;
  });
};

/** "2026-10-07" (a local calendar date) → "7 Oct" / "7 paź" without zone shifts. */
export const formatLocalDate = (ymd: string | null | undefined, lang: string): string => {
  if (!ymd) return '';
  const date = new Date(`${ymd.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return ymd;
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
  } catch {
    return ymd.slice(0, 10);
  }
};

/** A date of an instant in the device zone ("7 Oct"). */
export const formatShortDate = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

/** Date and time of an instant in the device zone ("7 Oct, 14:05"). */
export const formatDateTime = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(intlLocale(lang), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};
