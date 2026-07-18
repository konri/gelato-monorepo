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
};

export type SpotDetailsResponse = { spot: SpotDetails | null };
