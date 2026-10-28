export type MenuTaste = {
  id: string;
  spotId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  type: string;
  imageUrl?: string | null;
  price: number;
  loyaltyPoints: number;
  ingredients?: string | null;
  allergens: string[];
  kcalPerPortion?: number | null;
  kcalPer100g?: number | null;
  isAvailable: boolean;
};

export type MenuCategory = {
  id: string;
  nameLocal: { pl?: string; en?: string; ua?: string };
};

export type MenuProduct = {
  id: string;
  spotId: string;
  name: string;
  description?: string | null;
  type: string;
  categoryId?: string | null;
  menuCategory?: MenuCategory | null;
  imageUrl?: string | null;
  price: number;
  loyaltyPoints: number;
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
  categoryId?: string | null;
  categoryNameLocal?: { pl?: string; en?: string; ua?: string } | null;
  imageUrl?: string | null;
  price: number;
  loyaltyPoints: number;
  allergens: string[];
  isAvailable: boolean;
  // Box (ice cream pack) fields — product kind only.
  isBox?: boolean;
  maxTastes?: number | null;
  weightGrams?: number | null;
};

export type ManagedTastesResponse = { spotTastes: MenuTaste[] };
export type ManagedProductsResponse = { spotProducts: MenuProduct[] };
export type MenuCategoriesResponse = { spotMenuCategories: MenuCategory[] };

export type MenuSourceSpot = {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  cityName: string;
  cityNameLocal?: { pl?: string; en?: string; ua?: string } | null;
  tasteCount: number;
  productCount: number;
};

export type CopyTaste = {
  id: string;
  title: string;
  type: string;
  price: number;
  isAvailable: boolean;
};

export type CopyProduct = {
  id: string;
  name: string;
  type: string;
  price: number;
  isAvailable: boolean;
  menuCategory?: { id: string; nameLocal: MenuCategory['nameLocal'] } | null;
};

export type MenuCopyPreview = {
  tastes: CopyTaste[];
  products: CopyProduct[];
};

export type CopySpotMenuResult = {
  copiedTastes: number;
  copiedProducts: number;
};
