import {
  DeliveryAvailability,
  Product,
  Taste,
  checkDeliveryAvailability,
  getProductById,
  getSpotProducts,
} from '@repo/api-client';
import { useCallback, useState } from 'react';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { useGraphQLQuery } from './useGraphQLQuery';

// Imperative delivery check (runs on demand when the user picks an address).
export const useDeliveryCheck = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DeliveryAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    async (spotId: string, latitude: number, longitude: number) => {
      setChecking(true);
      setError(null);
      try {
        const token = await safeGetItem('access_token');
        const res = await checkDeliveryAvailability(spotId, latitude, longitude, {
          token: token ?? undefined,
        });
        if (res.success && res.data) {
          setResult(res.data);
          return res.data;
        }
        setError(res.error?.message ?? 'Failed to check delivery');
        return null;
      } finally {
        setChecking(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { check, checking, result, error, reset };
};

export const useSpotProducts = (spotId: string | null) =>
  useGraphQLQuery<Product[]>(
    (options) => getSpotProducts(spotId ?? '', options),
    {},
    [spotId],
  );

export const useProductDetail = (id: string | null) =>
  useGraphQLQuery<Product | null>(
    (options) => getProductById(id ?? '', options),
    {},
    [id],
  );

/* ---------- Delivery time slots ---------- */

export type TimeSlot = {
  // ISO start of the slot; null = ASAP
  startIso: string | null;
  label: string; // "17:00 – 18:00"
};

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Parse "10:00-22:00" → { open: 600, close: 1320 } in minutes, or null.
const parseHours = (range?: string): { open: number; close: number } | null => {
  if (!range || !range.includes('-')) return null;
  const [o, c] = range.split('-');
  const toMin = (s: string) => {
    const [h, m] = s.trim().split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const open = toMin(o);
  const close = toMin(c);
  if (Number.isNaN(open) || Number.isNaN(close)) return null;
  return { open, close };
};

/**
 * Build selectable 1-hour delivery slots for a given day, honouring the spot's
 * opening hours. For "today" the earliest slot starts 2h from now.
 */
export const buildTimeSlots = (
  openingHours: Record<string, string> | string | null | undefined,
  day: Date,
  now: Date,
): TimeSlot[] => {
  if (!openingHours || typeof openingHours !== 'object') return [];
  const hours = parseHours(openingHours[DAY_KEYS[day.getDay()]]);
  if (!hours) return [];

  const isToday = day.toDateString() === now.toDateString();
  // Earliest start (minutes since midnight): opening, or now+2h rounded up to the hour.
  let earliest = hours.open;
  if (isToday) {
    const nowMin = now.getHours() * 60 + now.getMinutes() + 120;
    earliest = Math.max(earliest, Math.ceil(nowMin / 60) * 60);
  }

  const slots: TimeSlot[] = [];
  for (let start = earliest; start + 60 <= hours.close; start += 60) {
    const startH = Math.floor(start / 60);
    const endH = startH + 1;
    const slotDate = new Date(day);
    slotDate.setHours(startH, 0, 0, 0);
    slots.push({
      startIso: slotDate.toISOString(),
      label: `${String(startH).padStart(2, '0')}:00 – ${String(endH).padStart(2, '0')}:00`,
    });
  }
  return slots;
};

// A menu row is either an ice-cream taste or a product; both are orderable.
export type MenuItem = {
  kind: 'taste' | 'product';
  id: string;
  spotId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  price: number;
  type: string; // category used for section grouping
  allergens: string[];
  // Box products: carry the full product so the row can open the picker.
  product?: Product;
};

const TYPE_ORDER = ['SORBET', 'MILK', 'GELATO', 'VEGAN', 'COFFEE', 'BEVERAGE', 'DESSERT', 'MERCHANDISE', 'OTHER'];

export const tasteToMenuItem = (t: Taste): MenuItem => ({
  kind: 'taste',
  id: t.id,
  spotId: t.spotId,
  title: t.title,
  subtitle: t.subtitle,
  imageUrl: t.imageUrl,
  price: t.price,
  type: t.type,
  allergens: t.allergens,
});

export const productToMenuItem = (p: Product): MenuItem => ({
  kind: 'product',
  id: p.id,
  spotId: p.spotId,
  title: p.name,
  subtitle: p.description,
  imageUrl: p.imageUrl,
  price: p.price,
  type: p.type,
  allergens: p.allergens,
  product: p,
});

// Build SectionList sections from tastes + products, grouped by type.
export const buildMenuSections = (
  tastes: Taste[],
  products: Product[],
): { type: string; data: MenuItem[] }[] => {
  const items = [...tastes.map(tasteToMenuItem), ...products.map(productToMenuItem)];
  const byType = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type)!.push(item);
  }
  return Array.from(byType.entries())
    .sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a[0]);
      const bi = TYPE_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([type, data]) => ({
      type,
      data: data.sort((x, y) => x.title.localeCompare(y.title)),
    }));
};
