import type { UpsertMerchantPointsProgramInput } from "@/shared/api-client/src/graphql/mutations/merchantPointsProgram";
import type { MerchantPointsProgram } from "@/shared/api-client/src/graphql/queries/merchantPointsProgram";

export type PointsProgramFormData = {
  amountSpent: string;
  pointsAwarded: string;
  cardMessage: string;
  isActive: boolean;
};

export const DEFAULT_POINTS_PROGRAM_FORM_DATA: PointsProgramFormData = {
  amountSpent: "",
  pointsAwarded: "",
  cardMessage: "",
  isActive: true,
};

export const buildPointsProgramFormDefaults = (
  pointsProgram?: MerchantPointsProgram | null,
): PointsProgramFormData => {
  if (!pointsProgram) {
    return DEFAULT_POINTS_PROGRAM_FORM_DATA;
  }

  return {
    amountSpent: pointsProgram.amountSpent.toString(),
    pointsAwarded: pointsProgram.pointsAwarded.toString(),
    cardMessage: pointsProgram.cardMessage ?? "",
    isActive: pointsProgram.isActive,
  };
};

export const buildPointsProgramInput = (
  data: PointsProgramFormData,
): UpsertMerchantPointsProgramInput => ({
  amountSpent: Number(data.amountSpent),
  pointsAwarded: Number(data.pointsAwarded),
  cardMessage: data.cardMessage.trim() || undefined,
  isActive: data.isActive,
});
