export type MerchantPointsProgram = {
  id: string;
  merchantId: string;
  amountSpent: number;
  pointsAwarded: number;
  cardMessage?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetMerchantPointsProgramResponse = {
  getMerchantPointsProgram?: MerchantPointsProgram | null;
};

export type GetMerchantPointsProgramVariables = {
  merchantId: string;
};

export type MerchantUserPointStatus = {
  userId: string;
  merchantId: string;
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
  bonusMultiplier: number;
  fixedPoints: number;
  createdAt: string;
  updatedAt: string;
};

export type MerchantUserPointBalanceResponse = {
  merchantUserPointBalance: MerchantUserPointStatus;
};
