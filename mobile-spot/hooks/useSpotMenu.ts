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
import { spotStore } from '@/stores/spotStore';
import { useActiveSpotId } from './useActiveSpot';

// Built-in sections. Custom sections and "Other" are ordered after these.
const TYPE_ORDER = [
  'SORBET',
  'MILK',
  'GELATO',
  'VEGAN',
  'TASTE',
  'ICE_CREAM_BOX',
  'COFFEE',
  'BEVERAGE',
  'DESSERT',
  'SANDWICH',
  'BREAD',
  'PASTRY',
  'MERCHANDISE',
];

export type MenuSection = {
  type: string;
  titleLocal?: { pl?: string; en?: string; ua?: string } | null;
  items: MenuItem[];
};

function sectionRank(key: string): number {
  const index = TYPE_ORDER.indexOf(key);
  if (index !== -1) return index;
  if (key.startsWith('cat:')) return 50;
  if (key === 'OTHER') return 60;
  return 70;
}

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
      loyaltyPoints: t.loyaltyPoints ?? 0,
      allergens: t.allergens,
      isAvailable: t.isAvailable,
    })),
    ...products.map<MenuItem>((p) => ({
      kind: 'product',
      id: p.id,
      title: p.name,
      description: p.description,
      type: p.type,
      categoryId: p.categoryId,
      categoryNameLocal: p.menuCategory?.nameLocal ?? null,
      imageUrl: p.imageUrl,
      price: p.price,
      loyaltyPoints: p.loyaltyPoints ?? 0,
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
  const titles: Record<string, MenuSection['titleLocal']> = {};
  for (const it of items) {
    const key = it.categoryId ? `cat:${it.categoryId}` : it.type;
    (byType[key] ??= []).push(it);
    if (it.categoryNameLocal) titles[key] = it.categoryNameLocal;
  }
  return Object.keys(byType)
    .sort((a, b) => {
      const rank = sectionRank(a) - sectionRank(b);
      if (rank !== 0) return rank;
      const an = titles[a]?.pl || titles[a]?.en || a;
      const bn = titles[b]?.pl || titles[b]?.en || b;
      return an.localeCompare(bn, 'pl');
    })
    .map((type) => ({ type, titleLocal: titles[type] ?? null, items: byType[type] }));
}

export function useSpotMenu() {
  const spotId = useActiveSpotId();
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    if (!spotId) {
      setSections([]);
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [tastes, products] = await Promise.all([
      getManagedTastes(spotId, { token }),
      getManagedProducts(spotId, { token }),
    ]);
    // Stale guard: the spot changed while loading.
    if (spotStore.getActiveSpotId() !== spotId) return;
    if (tastes.error || products.error) {
      setError(true);
      setLoading(false);
      return;
    }
    setSections(groupByType(toItems(tastes.data ?? [], products.data ?? [])));
    setLoading(false);
  }, [spotId]);

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
    async (item: MenuItem): Promise<string | null> => {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res =
        item.kind === 'taste'
          ? await apiDeleteTaste(item.id, { token, silent: true })
          : await apiDeleteProduct(item.id, { token, silent: true });
      if (res.error) return res.error.message || '';
      await load();
      return null;
    },
    [load],
  );

  return { sections, spotId, loading, error, refetch: load, toggleAvailability, removeItem };
}
