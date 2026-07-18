export type PointTemplate = {
  id: string;
  spotId: string;
  name: string;
  points: number;
  isActive: boolean;
};

export type PrizeValidation = {
  id: string;
  isRedeemed: boolean;
  redeemedAt?: string | null;
  prize: {
    id: string;
    title: string;
    pointsCost: number;
  };
};

export type SpotPointTemplatesResponse = { spotPointTemplates: PointTemplate[] };

// Customer summary shown to staff before awarding points (by QR id or code).
export type LoyaltyCustomer = {
  id: string;
  name?: string | null;
  loyaltyCode?: string | null;
  profilePicture?: string | null;
  availablePoints: number;
  totalPoints: number;
  availablePrizes: number;
};

export type LoyaltyCustomerResponse = { loyaltyCustomer: LoyaltyCustomer | null };
