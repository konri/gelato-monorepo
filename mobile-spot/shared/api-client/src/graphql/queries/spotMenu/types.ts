export type MenuTaste = {
  id: string;
  spotId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  type: string;
  imageUrl?: string | null;
  price: number;
  ingredients?: string | null;
  allergens: string[];
  kcalPerPortion?: number | null;
  kcalPer100g?: number | null;
  isAvailable: boolean;
};

export type MenuProduct = {
  id: string;
  spotId: string;
  name: string;
  description?: string | null;
  type: string;
  imageUrl?: string | null;
  price: number;
  isBox: boolean;
  maxTastes?: number | null;
  weightGrams?: number | null;
  allergens: string[];
  kcalPerPortion?: number | null;
  kcalPer100g?: number | null;
  isAvailable: boolean;
};

/** Unified menu item for rendering tastes + products in one grouped list. */
export type MenuItem = {
  kind: 'taste' | 'product';
  id: string;
  title: string;
  description?: string | null;
  type: string;
  imageUrl?: string | null;
  price: number;
  allergens: string[];
  isAvailable: boolean;
  // Box (ice cream pack) fields — product kind only.
  isBox?: boolean;
  maxTastes?: number | null;
  weightGrams?: number | null;
};

export type SpotTastesResponse = { spotTastes: MenuTaste[] };
export type SpotProductsResponse = { spotProducts: MenuProduct[] };
