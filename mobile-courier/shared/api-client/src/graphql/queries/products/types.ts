import type { LocalizedText } from '../tastes/types';

export type ProductCategory =
  | 'TASTE'
  | 'COFFEE'
  | 'BEVERAGE'
  | 'DESSERT'
  | 'MERCHANDISE'
  | 'ICE_CREAM_BOX'
  | 'SANDWICH'
  | 'BREAD'
  | 'PASTRY'
  | 'OTHER';

export type ProductMenuCategory = {
  id: string;
  nameLocal: LocalizedText;
};

export type Product = {
  id: string;
  spotId: string;
  name: string;
  nameLocal: LocalizedText;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  type: ProductCategory;
  categoryId?: string | null;
  menuCategory?: ProductMenuCategory | null;
  imageUrl?: string | null;
  price: number;
  isBox: boolean;
  maxTastes?: number | null;
  weightGrams?: number | null;
  kcalPerPortion?: number | null;
  kcalPer100g?: number | null;
  allergens: string[];
  isAvailable: boolean;
};

export type SpotProductsResponse = { spotProducts: Product[] };
export type ProductDetailResponse = { product: Product | null };
