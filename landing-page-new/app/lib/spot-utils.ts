import type { City, LocalizedName, Spot, Taste, Product, MenuItem } from "./types";
import type { Locale } from "../i18n/translations";

// Section order mirrors the mobile client's TYPE_ORDER.
const TYPE_ORDER = [
  "SORBET",
  "MILK",
  "GELATO",
  "VEGAN",
  "TASTE",
  "ICE_CREAM_BOX",
  "COFFEE",
  "BEVERAGE",
  "DESSERT",
  "SANDWICH",
  "BREAD",
  "PASTRY",
  "MERCHANDISE",
];

function sectionRank(key: string): number {
  const index = TYPE_ORDER.indexOf(key);
  if (index !== -1) return index;
  if (key.startsWith("cat:")) return 50;
  if (key === "OTHER") return 60;
  return 70;
}

/**
 * Merge a spot's tastes and products into unified menu items grouped by type,
 * ordered like the mobile app. Only available items are included.
 */
export function buildMenuSections(
  tastes: Taste[],
  products: Product[],
): { type: string; titleLocal?: LocalizedName | null; items: MenuItem[] }[] {
  const rows: { item: MenuItem; key: string; titleLocal?: LocalizedName | null }[] = [
    ...tastes
      .filter((t) => t.isAvailable)
      .map((t) => ({
        key: t.type,
        titleLocal: null,
        item: {
          kind: "taste" as const,
          id: t.id,
          spotId: t.spotId,
          title: t.title,
          titleLocal: t.titleLocal,
          subtitle: t.subtitle,
          description: t.description,
          type: t.type,
          imageUrl: t.imageUrl,
          price: t.price,
          allergens: t.allergens,
          kcalPerPortion: t.kcalPerPortion,
        },
      })),
    ...products
      .filter((p) => p.isAvailable)
      .map((p) => ({
        key: p.menuCategory?.id ? `cat:${p.menuCategory.id}` : p.type,
        titleLocal: p.menuCategory?.nameLocal ?? null,
        item: {
          kind: "product" as const,
          id: p.id,
          spotId: p.spotId,
          title: p.name,
          titleLocal: p.nameLocal,
          description: p.description,
          type: p.type,
          imageUrl: p.imageUrl,
          price: p.price,
          allergens: p.allergens,
          isBox: p.isBox,
          maxTastes: p.maxTastes,
        },
      })),
  ];

  const byType = new Map<string, { titleLocal?: LocalizedName | null; items: MenuItem[] }>();
  for (const row of rows) {
    const section = byType.get(row.key) ?? { titleLocal: row.titleLocal, items: [] };
    section.items.push(row.item);
    if (row.titleLocal) section.titleLocal = row.titleLocal;
    byType.set(row.key, section);
  }

  return Array.from(byType.entries())
    .sort((a, b) => {
      const rank = sectionRank(a[0]) - sectionRank(b[0]);
      if (rank !== 0) return rank;
      const aLabel = a[1].titleLocal?.pl || a[1].titleLocal?.en || a[0];
      const bLabel = b[1].titleLocal?.pl || b[1].titleLocal?.en || b[0];
      return aLabel.localeCompare(bLabel, "pl");
    })
    .map(([type, section]) => ({ type, titleLocal: section.titleLocal, items: section.items }));
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/**
 * Is the spot open right now, given its openingHours JSON
 * ({ monday: "10:00-22:00", ... })? Returns null if unknown.
 * Mirrors the mobile client's isSpotOpenNow.
 */
export function isSpotOpenNow(
  openingHours: Record<string, string> | null | undefined,
  now: Date = new Date(),
): boolean | null {
  if (!openingHours || typeof openingHours !== "object") return null;
  const range = openingHours[DAY_KEYS[now.getDay()]];
  if (!range || !range.includes("-")) return false;
  const [open, close] = range.split("-");
  const toMin = (s: string) => {
    const [h, m] = s.trim().split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMin(open);
  let closeMin = toMin(close);
  if (closeMin <= openMin) closeMin += 24 * 60;
  const adjNow = nowMin < openMin ? nowMin + 24 * 60 : nowMin;
  return adjNow >= openMin && adjNow < closeMin;
}

/** Localized city name with graceful fallback to the canonical name. */
export function localizedCityName(
  city: Pick<City, "name" | "nameLocal">,
  locale: Locale,
): string {
  const local = city.nameLocal as LocalizedName | undefined;
  return (local && local[locale]) || city.name;
}

/**
 * The subset of spots belonging to the city that has the most spots.
 * Used as the map's initial focus when the visitor's location is unavailable.
 */
export function densestCitySpots(spots: Spot[]): Spot[] {
  if (spots.length === 0) return [];
  const byCity: Record<string, Spot[]> = {};
  for (const s of spots) {
    (byCity[s.cityId] ??= []).push(s);
  }
  let best: Spot[] = [];
  for (const arr of Object.values(byCity)) {
    if (arr.length > best.length) best = arr;
  }
  return best;
}

/** Center + zoom that fits all provided spots. */
export function boundsFor(spots: Spot[]): {
  center: { lat: number; lng: number };
  zoom: number;
} {
  if (spots.length === 0) {
    return { center: { lat: 52.2297, lng: 21.0122 }, zoom: 6 };
  }
  const lats = spots.map((s) => s.latitude);
  const lngs = spots.map((s) => s.longitude);
  const center = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
  const spread = Math.max(
    Math.max(...lats) - Math.min(...lats),
    Math.max(...lngs) - Math.min(...lngs),
  );
  // Rough zoom heuristic; the map also auto-fits via fitBounds when possible.
  let zoom = 13;
  if (spread > 0.5) zoom = 9;
  else if (spread > 0.2) zoom = 11;
  else if (spread > 0.05) zoom = 12;
  else if (spots.length === 1) zoom = 14;
  return { center, zoom };
}
