export type LocalizedName = {
  pl?: string;
  en?: string;
  ua?: string;
  [key: string]: string | undefined;
};

export type City = {
  id: string;
  name: string;
  nameLocal: LocalizedName;
  country: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
};

export type Role =
  | "SUPER_ADMIN"
  | "SPOTS_ADMIN"
  | "SPOT_ADMIN"
  | "EMPLOYEE"
  | "COURIER"
  | "CLIENT";

export type User = {
  id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  firstName?: string | null;
  surname?: string | null;
  loyaltyCode?: string | null;
  birthDate?: string | null;
  birthdayCompleted: boolean;
  profilePicture?: string | null;
  language: string;
  roles: Role[];
  preferredCityId?: string | null;
  preferredCity?: Pick<City, "id" | "name" | "nameLocal"> | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  locationPermission: boolean;
  notificationPermission: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type PointBalance = {
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
};

export type TransactionType =
  | "EARNED"
  | "SPENT"
  | "REFUND"
  | "BONUS"
  | "REFERRAL"
  | "BIRTHDAY"
  | "QUEST";

export type PointTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: string;
};

export type ReferralCode = {
  id: string;
  code: string;
  createdAt: string;
};

export type MyOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryAddress: string;
  spot?: { id: string; name: string } | null;
};

export type Complaint = {
  id: string;
  orderId: string;
  subject: string;
  message: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
};

export type ReferralStats = {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
};

export type Prize = {
  id: string;
  title: string;
  titleLocal: LocalizedName;
  description?: string | null;
  descriptionLocal?: LocalizedName | null;
  imageUrl?: string | null;
  pointsCost: number;
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
};

export type UserPrize = {
  id: string;
  qrCode: string;
  isRedeemed: boolean;
  redeemedAt?: string | null;
  claimedAt: string;
  validUntil: string;
  prize: Pick<Prize, "id" | "title" | "titleLocal" | "imageUrl" | "pointsCost">;
};

export type TasteCategory = "GELATO" | "MILK" | "SORBET" | "VEGAN" | "OTHER";

export type Taste = {
  id: string;
  spotId: string;
  title: string;
  titleLocal: LocalizedName;
  subtitle?: string | null;
  description?: string | null;
  type: TasteCategory;
  imageUrl?: string | null;
  price: number;
  kcalPerPortion?: number | null;
  allergens: string[];
  isAvailable: boolean;
};

export type ProductCategory =
  | "TASTE"
  | "COFFEE"
  | "BEVERAGE"
  | "DESSERT"
  | "MERCHANDISE"
  | "OTHER";

export type Product = {
  id: string;
  spotId: string;
  name: string;
  nameLocal: LocalizedName;
  description?: string | null;
  type: ProductCategory;
  imageUrl?: string | null;
  price: number;
  isBox: boolean;
  maxTastes?: number | null;
  allergens: string[];
  isAvailable: boolean;
};

/** Unified menu item, so tastes and products can render in one grouped list. */
export type MenuItem = {
  kind: "taste" | "product";
  id: string;
  spotId: string;
  title: string;
  titleLocal: LocalizedName;
  subtitle?: string | null;
  type: string;
  imageUrl?: string | null;
  price: number;
  allergens: string[];
  isBox?: boolean;
};

export type OrderItemInput = {
  tasteId?: string;
  productId?: string;
  quantity: number;
  boxTasteIds?: string[];
};

export type FulfillmentType = "DELIVERY" | "PICKUP";

export type CreateOrderInput = {
  spotId: string;
  items: OrderItemInput[];
  // 'DELIVERY' (default) requires the address fields; 'PICKUP' omits them.
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentMethod: string;
  buildingType?: string;
  apartmentNumber?: string;
  floor?: string;
  deliveryNotes?: string;
  spotNotes?: string;
  scheduledFor?: string;
  promoCode?: string;
  invoiceRequested?: boolean;
  invoiceNIP?: string;
  invoiceCompanyName?: string;
  invoiceAddress?: string;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
};

// Delivery-availability check for a candidate address at a spot.
export type DeliveryAvailability = {
  canDeliver: boolean;
  distanceKm: number;
  deliveryRadiusKm: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
};

export type Spot = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  cityId: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  photos: string[];
  openingHours?: Record<string, string> | null;
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
  hasSeating: boolean;
  seatingCapacity?: number | null;
  accessibilityFeatures?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  isActive: boolean;
  city?: Pick<City, "id" | "name" | "nameLocal"> | null;
};

export type SpotReview = {
  id: string;
  rating: number;
  comment?: string | null;
  authorName: string;
  createdAt: string;
};
