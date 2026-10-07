/**
 * Rewards waiting to be picked up: the server flags are a snapshot (the
 * overview may come from the offline copy), so the pick-up date is always
 * checked on the device too (review #6). Pure: `scripts` can import it.
 */

type PickUpLike = { isRedeemableNow: boolean; isExpired: boolean; validUntil: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** The pick-up deadline has passed (or the date is unreadable). */
export const isPastPickUp = (validUntil: string, now: number = Date.now()): boolean => {
  const until = Date.parse(validUntil);
  return !Number.isFinite(until) || until <= now;
};

/** Can be picked up now: server flags AND a deadline still in the future. */
export const isPickUpOpen = (item: PickUpLike, now: number = Date.now()): boolean =>
  item.isRedeemableNow && !item.isExpired && !isPastPickUp(item.validUntil, now);

/**
 * Device-calendar days from today to the deadline: 0 = today, 1 = tomorrow.
 * Null when the deadline has passed or cannot be read.
 */
export const pickUpDaysLeft = (validUntil: string, now: number = Date.now()): number | null => {
  if (isPastPickUp(validUntil, now)) return null;
  const days = Math.round((startOfDay(new Date(validUntil)) - startOfDay(new Date(now))) / DAY_MS);
  return Math.max(0, days);
};
