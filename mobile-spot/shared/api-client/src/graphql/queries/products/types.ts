import type { LocalizedText } from '../tastes/types';

export type ProductCategory =
  | 'TASTE'
  | 'COFFEE'
  | 'BEVERAGE'
  | 'DESSERT'
  | 'MERCHANDISE'
  | 'OTHER';

export type Product = {
  id: string;
  spotId: string;
  name: string;
  nameLocal: LocalizedText;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  type: ProductCategory;
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
