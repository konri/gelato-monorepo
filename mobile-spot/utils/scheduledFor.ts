type Translate = (key: string, options?: Record<string, unknown>) => string;

export type ReadyByKind = 'asap' | 'today' | 'tomorrow' | 'later';

export type ReadyByInfo = {
  label: string;
  kind: ReadyByKind;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Customer-requested ready time: ASAP, Today 14:00, or Tomorrow 16:00. */
export function formatReadyBy(
  scheduledFor: string | null | undefined,
  t: Translate,
  locale: string,
): ReadyByInfo {
  if (!scheduledFor) return { label: t('Spot.readyAsap'), kind: 'asap' };
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) return { label: t('Spot.readyAsap'), kind: 'asap' };

  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (sameDay(date, today)) return { label: `${t('Checkout.today')} ${time}`, kind: 'today' };
  if (sameDay(date, tomorrow)) return { label: `${t('Checkout.tomorrow')} ${time}`, kind: 'tomorrow' };

  const dateStr = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return { label: `${dateStr} ${time}`, kind: 'later' };
}

/** ASAP / missing times sort first, then soonest scheduled. */
export function scheduledForSortKey(scheduledFor?: string | null): number {
  if (!scheduledFor) return 0;
  const value = new Date(scheduledFor).getTime();
  return Number.isNaN(value) ? 0 : value;
}
