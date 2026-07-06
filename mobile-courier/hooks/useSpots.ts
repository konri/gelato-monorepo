import { toggleFavoriteSpot } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { useCallback, useSyncExternalStore } from 'react';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Is the spot open right now, given its openingHours JSON
 * ({ monday: "10:00-22:00", ... })? Returns null if unknown.
 */
export const isSpotOpenNow = (
  openingHours: Record<string, string> | string | null | undefined,
  now: Date = new Date(),
): boolean | null => {
  if (!openingHours || typeof openingHours !== 'object') return null;
  const range = openingHours[DAY_KEYS[now.getDay()]];
  if (!range || !range.includes('-')) return false;
  const [open, close] = range.split('-');
  const toMin = (s: string) => {
    const [h, m] = s.trim().split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMin(open);
  let closeMin = toMin(close);
  // Handle past-midnight closing (e.g. 20:00-02:00).
  if (closeMin <= openMin) closeMin += 24 * 60;
  const adjNow = nowMin < openMin ? nowMin + 24 * 60 : nowMin;
  return adjNow >= openMin && adjNow < closeMin;
};

/**
 * Global favorite-override store shared across every screen, so toggling a
 * spot's heart in the detail view instantly reflects on the Spots carousel
 * (and vice versa). Keyed by spotId → current favorite boolean.
 */
let favOverrides: Record<string, boolean> = {};
const favListeners = new Set<() => void>();
const notifyFav = () => favListeners.forEach((l) => l());
const subscribeFav = (l: () => void) => {
  favListeners.add(l);
  return () => favListeners.delete(l);
};
const setOverride = (spotId: string, value: boolean) => {
  favOverrides = { ...favOverrides, [spotId]: value };
  notifyFav();
};

/**
 * Optimistic favorite toggle backed by the shared store. The heart flips
 * instantly everywhere; the server mutation runs in the background.
 */
export const useFavoriteToggle = () => {
  const overrides = useSyncExternalStore(subscribeFav, () => favOverrides);

  const isFavorite = useCallback(
    (spotId: string, serverValue?: boolean) =>
      spotId in overrides ? overrides[spotId] : !!serverValue,
    [overrides],
  );

  const toggle = useCallback(async (spotId: string, currentValue: boolean) => {
    setOverride(spotId, !currentValue); // optimistic, global
    const token = await safeGetItem('access_token');
    const res = await toggleFavoriteSpot(spotId, { token: token ?? undefined });
    setOverride(spotId, res.success && typeof res.data === 'boolean' ? res.data : currentValue);
  }, []);

  return { isFavorite, toggle };
};
