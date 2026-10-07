import type { TenantText } from '@/shared/api-client/src/graphql/queries/staffLoyalty/types';

/**
 * Small display helpers for the counter loyalty screens (BRANDS_SPEC §4.8).
 * The numbers themselves always come from the server; these only format.
 */

/** A tenant text in the app language (`{ pl, en, ua }`), else the base text. */
export function localText(base: string, local: TenantText | undefined, language: string): string {
  const value = local?.[language.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value : base;
}

/** 200 → "2", 150 → "1.5" (PL / UA: "1,5"). */
export function formatMultiplier(percent: number, language: string): string {
  const value = Math.round(percent) / 100;
  const text = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  return language.toLowerCase() === 'en' ? text : text.replace('.', ',');
}

/** The server's rule (PointsRuleEngine.applyMultiplier): floor(base × percent / 100). */
export function applyMultiplier(base: number, percent: number | null | undefined): number {
  const p = percent && percent > 100 ? percent : 100;
  return Math.floor((base * p) / 100);
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "14:30" today, else "12.10 14:30" style (device locale). */
export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay(d, new Date()) ? time : `${d.toLocaleDateString()} ${time}`;
}

/** Date only (device locale). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}
