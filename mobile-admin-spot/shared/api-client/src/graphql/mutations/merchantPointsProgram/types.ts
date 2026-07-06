import type { MerchantPointsProgram } from "../../queries/merchantPointsProgram";

export type UpsertMerchantPointsProgramInput = {
  amountSpent: number;
  pointsAwarded: number;
  cardMessage?: string;
  isActive?: boolean;
};

export type SaveMerchantPointsProgramResponse = {
  saveMerchantPointsProgram: MerchantPointsProgram;
};

export type SaveMerchantPointsProgramVariables = {
  merchantId: string;
  data: UpsertMerchantPointsProgramInput;
};

export type UserMerchantPointBalance = {
  id: string;
  userId: string;
  merchantId: string;
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
  createdAt: string;
  updatedAt: string;
};

export type AddMerchantPointsVariables = {
  description: string;
  amount: number;
  programId: string;
  userId: string;
  storeId: string;
};

export type AddMerchantPointsResponse = {
  addMerchantPoints: UserMerchantPointBalance;
};
