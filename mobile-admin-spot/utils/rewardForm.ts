import type {
  CreateRewardInput,
  UpsertRewardStoreOverrideInput,
} from "@/shared/api-client/src/graphql/mutations/reward";
import type {
  RewardSourceType,
  RewardValueType,
} from "@/shared/api-client/src/graphql/queries/myRewards";

export const REWARD_SOURCE_TYPE: RewardSourceType = "STAMP_CARD";

export const REWARD_VALUE_TYPES: RewardValueType[] = [
  "FREE_SERVICE",
  "DISCOUNT_PERCENT",
  "DISCOUNT_AMOUNT",
  "POINTS",
] as const;

export const getRewardValueTypeOptions = (t: (key: string) => string) => [
  { label: t("Loyalty.milestoneTypeFreeService"), value: "FREE_SERVICE" },
  {
    label: t("Loyalty.milestoneTypeDiscountPercent"),
    value: "DISCOUNT_PERCENT",
  },
  { label: t("Loyalty.milestoneTypeDiscountAmount"), value: "DISCOUNT_AMOUNT" },
  { label: t("Loyalty.milestoneTypePointsReward"), value: "POINTS" },
];

export type RewardFormData = {
  title: string;
  description: string;
  imageUrl?: string;
  valueType: RewardValueType;
  discountPercent?: string;
  discountAmount?: string;
  pointsValue?: string;
  validFrom?: string;
  validUntil?: string;
};

export const buildRewardInput = (
  merchantId: string,
  data: RewardFormData,
): CreateRewardInput => ({
  merchantId,
  title: data.title,
  description: data.description || undefined,
  imageUrl: data.imageUrl || undefined,
  sourceType: REWARD_SOURCE_TYPE,
  valueType: data.valueType,
  discountPercent:
    data.valueType === "DISCOUNT_PERCENT"
      ? Number(data.discountPercent)
      : undefined,
  discountAmount:
    data.valueType === "DISCOUNT_AMOUNT"
      ? Number(data.discountAmount)
      : undefined,
  pointsValue:
    data.valueType === "POINTS" ? Number(data.pointsValue) : undefined,
  validFrom: data.validFrom,
  validUntil: data.validUntil,
});

export const buildRewardStoreOverrideInput = (
  data: RewardFormData,
): UpsertRewardStoreOverrideInput => ({
  title: data.title,
  description: data.description || undefined,
  imageUrl: data.imageUrl || undefined,
  valueType: data.valueType,
  discountPercent:
    data.valueType === "DISCOUNT_PERCENT"
      ? Number(data.discountPercent)
      : undefined,
  discountAmount:
    data.valueType === "DISCOUNT_AMOUNT"
      ? Number(data.discountAmount)
      : undefined,
  pointsValue:
    data.valueType === "POINTS" ? Number(data.pointsValue) : undefined,
  validFrom: data.validFrom,
  validUntil: data.validUntil,
});
