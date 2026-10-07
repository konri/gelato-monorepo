export type SpotDetails = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  latitude: number;
  longitude: number;
  logoUrl?: string | null;
  coverUrl?: string | null;
  photos: string[];
  openingHours?: Record<string, string> | null;
  hasSeating: boolean;
  seatingCapacity?: number | null;
  accessibilityFeatures?: string | null;
  deliveryEnabled?: boolean;
  deliveryFee?: number | null;
  freeDeliveryThreshold?: number | null;
  courierPayout?: number | null;
  pickupEnabled?: boolean;
  onlinePaymentEnabled?: boolean;
  isActive?: boolean;
  brand?: { id: string; name: string } | null;
  city?: { id: string; name: string; nameLocal?: Record<string, string> | null } | null;
};

export type SpotDetailsResponse = { spot: SpotDetails | null };
