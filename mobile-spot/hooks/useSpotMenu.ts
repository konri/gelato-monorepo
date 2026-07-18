import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getManagedTastes,
  getManagedProducts,
  updateTasteAvailability as apiToggleTaste,
  updateProductAvailability as apiToggleProduct,
  deleteTaste as apiDeleteTaste,
  deleteProduct as apiDeleteProduct,
  type MenuItem,
  type MenuTaste,
  type MenuProduct,
} from '@repo/api-client';
import { useCallback, useEffect, useState } from 'react';
import { getStoredSpotContext } from './useSpotOrders';

// Section order mirrors the client app's TYPE_ORDER.
const TYPE_ORDER = [
  'SORBET',
  'MILK',
  'GELATO',
  'VEGAN',
  'TASTE',
  'COFFEE',
  'BEVERAGE',
  'DESSERT',
  'MERCHANDISE',
  'OTHER',
];

export type MenuSection = { type: string; items: MenuItem[] };

function toItems(tastes: MenuTaste[], products: MenuProduct[]): MenuItem[] {
  return [
    ...tastes.map<MenuItem>((t) => ({
      kind: 'taste',
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      imageUrl: t.imageUrl,
      price: t.price,
      allergens: t.allergens,
      isAvailable: t.isAvailable,
    })),
    ...products.map<MenuItem>((p) => ({
      kind: 'product',
      id: p.id,
      title: p.name,
      description: p.description,
      type: p.type,
      imageUrl: p.imageUrl,
      price: p.price,
      allergens: p.allergens,
      isAvailable: p.isAvailable,
      isBox: p.isBox,
      maxTastes: p.maxTastes,
      weightGrams: p.weightGrams,
    })),
  ];
}

function groupByType(items: MenuItem[]): MenuSection[] {
  const byType: Record<string, MenuItem[]> = {};
  for (const it of items) (byType[it.type] ??= []).push(it);
  const sections: MenuSection[] = [];
  const seen = new Set<string>();
  for (const type of TYPE_ORDER) {
    if (byType[type]?.length) {
      sections.push({ type, items: byType[type] });
      seen.add(type);
    }
  }
  Object.keys(byType)
    .filter((k) => !seen.has(k))
    .forEach((k) => sections.push({ type: k, items: byType[k] }));
  return sections;
}

export function useSpotMenu() {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const ctx = await getStoredSpotContext();
    setSpotId(ctx.spotId);
    if (!ctx.spotId) {
      setSections([]);
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [tastes, products] = await Promise.all([
      getManagedTastes(ctx.spotId, { token }),
      getManagedProducts(ctx.spotId, { token }),
    ]);
    if (tastes.error || products.error) {
      setError(true);
      setLoading(false);
      return;
    }
    setSections(groupByType(toItems(tastes.data ?? [], products.data ?? [])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleAvailability = useCallback(async (item: MenuItem, next: boolean) => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    // Optimistic update.
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)),
      })),
    );
    const res =
      item.kind === 'taste'
        ? await apiToggleTaste(item.id, next, { token })
        : await apiToggleProduct(item.id, next, { token });
    if (res.error) {
      // Roll back on failure.
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === item.id ? { ...i, isAvailable: !next } : i)),
        })),
      );
    }
  }, []);

  const removeItem = useCallback(
    async (item: MenuItem) => {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res =
        item.kind === 'taste'
          ? await apiDeleteTaste(item.id, { token })
          : await apiDeleteProduct(item.id, { token });
      if (!res.error) await load();
    },
    [load],
  );

  return { sections, spotId, loading, error, refetch: load, toggleAvailability, removeItem };
}
