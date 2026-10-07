import { uiLocale } from './format';

/**
 * Promotion schedules (BRANDS_SPEC §2.7.4, §3.3). The backend stores windows
 * (ISO day 1 = Monday … 7 = Sunday, "HH:MM" start, "HH:MM" end with "24:00"
 * allowed, no midnight crossing, at most 21). The console edits them as
 * ranges: several days sharing one From/To.
 */

export type ScheduleWindow = { dayOfWeek: number; startTime: string; endTime: string };

export type ScheduleRange = {
  /** Stable React key. */
  key: string;
  days: number[];
  from: string;
  /** Ignored while `untilMidnight` is set (the window ends at 24:00). */
  to: string;
  untilMidnight: boolean;
};

export type RangeError = 'errNoDays' | 'errTimeFormat' | 'errTimeOrder';

/** Backend limits (PointsRuleEngine). */
export const MAX_SCHEDULE_WINDOWS = 21;
export const MULTIPLIER_PRESETS = [150, 200, 300] as const;
/** Custom multiplier ×1.1 … ×10, as percent. */
export const CUSTOM_MULTIPLIER_MIN = 110;
export const CUSTOM_MULTIPLIER_MAX = 1000;

export const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const END_OF_DAY = '24:00';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

let rangeSeq = 0;
function rangeKey(): string {
  rangeSeq += 1;
  return `range-${rangeSeq}`;
}

export function newRange(days: number[] = [], from = '', to = '', untilMidnight = false): ScheduleRange {
  return { key: rangeKey(), days, from, to, untilMidnight };
}

/** "HH:MM" → minutes (null when invalid); "24:00" only with `allowEndOfDay`. */
export function timeToMinutes(value: string, allowEndOfDay = false): number | null {
  const v = value.trim();
  if (allowEndOfDay && v === END_OF_DAY) return 24 * 60;
  const m = TIME_RE.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Windows grouped into ranges: same From/To → one range with several days. */
export function rangesFromWindows(windows: readonly ScheduleWindow[]): ScheduleRange[] {
  const byTime = new Map<string, ScheduleRange>();
  for (const w of windows) {
    const id = `${w.startTime}|${w.endTime}`;
    const existing = byTime.get(id);
    if (existing) {
      if (!existing.days.includes(w.dayOfWeek)) existing.days.push(w.dayOfWeek);
      continue;
    }
    const untilMidnight = w.endTime === END_OF_DAY;
    byTime.set(id, newRange([w.dayOfWeek], w.startTime, untilMidnight ? '' : w.endTime, untilMidnight));
  }
  return [...byTime.values()]
    .map((r) => ({ ...r, days: [...r.days].sort((a, b) => a - b) }))
    .sort((a, b) => a.days[0] - b.days[0] || a.from.localeCompare(b.from));
}

/** Ranges → backend windows (one per day and range), sorted. */
export function windowsFromRanges(ranges: readonly ScheduleRange[]): ScheduleWindow[] {
  const out: ScheduleWindow[] = [];
  for (const r of ranges) {
    const endTime = r.untilMidnight ? END_OF_DAY : r.to.trim();
    for (const day of r.days) out.push({ dayOfWeek: day, startTime: r.from.trim(), endTime });
  }
  return out.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

/** Per-range problems, plus the window limit across all ranges. */
export function validateRanges(ranges: readonly ScheduleRange[]): {
  rangeErrors: (RangeError | null)[];
  tooManyWindows: boolean;
} {
  const rangeErrors = ranges.map((r): RangeError | null => {
    if (r.days.length === 0) return 'errNoDays';
    const start = timeToMinutes(r.from);
    const end = r.untilMidnight ? 24 * 60 : timeToMinutes(r.to, true);
    if (start === null || end === null) return 'errTimeFormat';
    if (end <= start) return 'errTimeOrder';
    return null;
  });
  const windows = ranges.reduce((n, r) => n + r.days.length, 0);
  return { rangeErrors, tooManyWindows: windows > MAX_SCHEDULE_WINDOWS };
}

/** Short weekday name for an ISO day (1 = Monday) in the console language. */
export function dayShort(day: number): string {
  // 2024-01-01 was a Monday.
  return new Intl.DateTimeFormat(uiLocale(), { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, day)),
  );
}

export function dayLong(day: number): string {
  return new Intl.DateTimeFormat(uiLocale(), { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, day)),
  );
}

/**
 * Days as text: runs of three or more collapse ("Mon–Fri"), others are
 * listed ("Sat, Sun"). One day uses its long name. `everyDay` for all seven.
 */
export function formatDays(days: readonly number[], everyDay: string): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return everyDay;
  if (sorted.length === 1) return dayLong(sorted[0]);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 2) parts.push(`${dayShort(sorted[i])}–${dayShort(sorted[j])}`);
    else for (let k = i; k <= j; k++) parts.push(dayShort(sorted[k]));
    i = j + 1;
  }
  return parts.join(', ');
}

export type ScheduleLabels = {
  /** No windows: the promotion runs all day on every day of its dates. */
  always: string;
  everyDay: string;
  allDay: string;
};

/** One line per range, e.g. "Thursday 10:00–14:00", "Sat, Sun all day". */
export function scheduleLines(windows: readonly ScheduleWindow[], labels: ScheduleLabels): string[] {
  if (windows.length === 0) return [labels.always];
  return rangesFromWindows(windows).map((r) => {
    const days = formatDays(r.days, labels.everyDay);
    const end = r.untilMidnight ? END_OF_DAY : r.to;
    const hours = r.from === '00:00' && end === END_OF_DAY ? labels.allDay : `${r.from}–${end}`;
    const line = `${days} ${hours}`;
    // Some languages write weekday names in lower case; a line starts with a capital.
    return line.charAt(0).toLocaleUpperCase(uiLocale()) + line.slice(1);
  });
}

// ---------------------------------------------------------------------------
// Dates (YYYY-MM-DD "local dates" of the promotion's time zone)
// ---------------------------------------------------------------------------

/** Today (or `at`) as YYYY-MM-DD in a time zone; the browser's zone when it is unknown. */
export function localDateIn(timeZone: string | null | undefined, at: Date = new Date()): string {
  const make = (tz?: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = make(timeZone ?? undefined);
  } catch {
    fmt = make();
  }
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** A YYYY-MM-DD date for display (no time-zone shift). */
export function fmtLocalDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(uiLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** An instant shown in a time zone, e.g. "Thu 10:00" or "12.10.2026, 10:00". */
export function fmtInstantIn(iso: string, timeZone: string, withDate = true): string {
  const opts: Intl.DateTimeFormatOptions = withDate
    ? { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  try {
    return new Date(iso).toLocaleString(uiLocale(), { ...opts, timeZone });
  } catch {
    return new Date(iso).toLocaleString(uiLocale(), opts);
  }
}

/** ×1.5 / ×2 in the console language. */
export function fmtMultiplier(percent: number): string {
  return `×${new Intl.NumberFormat(uiLocale(), { maximumFractionDigits: 2 }).format(percent / 100)}`;
}

/** A custom multiplier as typed ("1.5", "1,5") → percent; null when not a number. */
export function parseMultiplier(raw: string): number | null {
  const n = Number(raw.trim().replace(',', '.'));
  if (!raw.trim() || !Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Percent → the custom field's text ("1.5"). */
export function multiplierInput(percent: number): string {
  return String(percent / 100);
}
