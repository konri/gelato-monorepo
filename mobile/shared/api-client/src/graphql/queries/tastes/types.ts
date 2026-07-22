export type LocalizedText = { pl?: string; en?: string; ua?: string } | string | null;

export type TasteCategory = 'SORBET' | 'MILK' | 'GELATO' | 'VEGAN' | 'OTHER';

export type City = {
  id: string;
  name: string;
  nameLocal: LocalizedText;
  latitude?: number;
  longitude?: number;
};

export type Spot = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  photos: string[];
  openingHours?: Record<string, string> | string | null;
  deliveryEnabled: boolean;
  deliveryFee: number;
  deliveryRadiusKm?: number | null;
  freeDeliveryThreshold?: number | null;
  hasSeating?: boolean;
  seatingCapacity?: number | null;
  accessibilityFeatures?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  isFavorite?: boolean;
};

export type Taste = {
  id: string;
  spotId: string;
  title: string;
  titleLocal: LocalizedText;
  subtitle?: string | null;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  type: TasteCategory;
  imageUrl?: string | null;
  price: number;
  kcalPerPortion?: number | null;
  kcalPer100g?: number | null;
  portionSizeGrams?: number | null;
  ingredients?: string | null;
  ingredientsLocal?: LocalizedText;
  allergens: string[];
  isAvailable: boolean;
};

export type PromoValidation = {
  valid: boolean;
  code: string;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  value?: number | null;
  discountAmount: number;
  isInfluencer: boolean;
  reason?: string | null;
};

export type ValidatePromoResponse = { validatePromoCode: PromoValidation };

export type DeliveryAvailability = {
  canDeliver: boolean;
  distanceKm: number;
  deliveryRadiusKm: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
};

export type CheckDeliveryResponse = {
  checkDeliveryAvailability: DeliveryAvailability;
};

export type CitiesResponse = { cities: City[] };
export type AllSpotsResponse = { spots: Spot[] };
export type SpotsByCityResponse = { spotsByCity: Spot[] };
export type SpotDetailResponse = { spot: Spot | null };
export type SpotTastesResponse = { spotTastes: Taste[] };
export type TasteDetailResponse = { taste: Taste | null };
