import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";
import type {
  StreakProgram,
  StreakProgramStage,
} from "@/shared/api-client/src/graphql/queries/streaks";
import type { TFunction } from "i18next";

type LoyaltyScopeEntity = {
  id: string;
  availableStoreIds?: string[] | null;
};

const sortIds = (ids: string[] | undefined | null) =>
  ids == null ? null : [...ids].sort();

const couponPayload = (c: Coupon) => ({
  code: c.code,
  title: c.title,
  shortDescription: c.shortDescription ?? null,
  description: c.description ?? null,
  imageUrl: c.imageUrl ?? null,
  couponType: c.couponType,
  availability: c.availability,
  displayType: c.displayType,
  pointsCost: c.pointsCost ?? null,
  priority: c.priority,
  rewardId: c.rewardId ?? null,
  validFrom: c.validFrom,
  validUntil: c.validUntil,
  assignToUserId: c.assignToUserId ?? null,
  exclusivityGroups: c.exclusivityGroups ?? null,
  buyQuantity: c.buyQuantity ?? null,
  getQuantity: c.getQuantity ?? null,
  discountType: c.discountType ?? null,
  discountValue: c.discountValue ?? null,
  dayOfWeek: c.dayOfWeek ?? null,
  thresholdAmount: c.thresholdAmount ?? null,
  discountAmount: c.discountAmount ?? null,
  itemName: c.itemName ?? null,
  itemBarcode: c.itemBarcode ?? null,
  daysBeforeBirthday: c.daysBeforeBirthday ?? null,
  daysAfterBirthday: c.daysAfterBirthday ?? null,
  activityType: c.activityType ?? null,
  isActive: c.isActive,
  usesPerUserLimit: c.usesPerUserLimit ?? null,
  globalUsageLimit: c.globalUsageLimit ?? null,
  isStackable: c.isStackable,
  availableStoreIds: sortIds(c.availableStoreIds),
});

const rewardPayload = (r: Reward) => ({
  title: r.title,
  description: r.description ?? null,
  imageUrl: r.imageUrl ?? null,
  sourceType: r.sourceType,
  valueType: r.valueType,
  discountPercent: r.discountPercent ?? null,
  discountAmount: r.discountAmount ?? null,
  pointsValue: r.pointsValue ?? null,
  productName: r.productName ?? null,
  isActive: r.isActive,
  availableStoreIds: sortIds(r.availableStoreIds),
});

const normalizeStreakStages = (stages: StreakProgramStage[]) =>
  [...stages]
    .sort(
      (a, b) =>
        a.dayThreshold - b.dayThreshold || String(a.id).localeCompare(String(b.id)),
    )
    .map((stage) => ({
      id: stage.id,
      dayThreshold: stage.dayThreshold,
      benefitType: stage.benefitType,
      rewardId: stage.rewardId ?? null,
      infoMessage: stage.infoMessage ?? null,
      pointsMultiplier: stage.pointsMultiplier ?? null,
      pointsAmount: stage.pointsAmount ?? null,
      reward: stage.reward
        ? { id: stage.reward.id, title: stage.reward.title }
        : null,
    }));

const streakPayload = (s: StreakProgram) => ({
  name: s.name,
  description: s.description ?? null,
  requiredConsecutiveDays: s.requiredConsecutiveDays,
  streakingPolicy: s.streakingPolicy,
  streakingInterval: s.streakingInterval,
  timezone: s.timezone ?? null,
  graceDays: s.graceDays,
  repeatable: s.repeatable,
  isActive: s.isActive,
  availableStoreIds: sortIds(s.availableStoreIds),
  rewardId: s.rewardId ?? null,
  reward: s.reward ? { id: s.reward.id, title: s.reward.title } : null,
  stages: normalizeStreakStages(s.stages ?? []),
});

const merchantContentEqualFromPayload =
  <T>(toPayload: (entity: T) => unknown) =>
  (a: T, b: T): boolean =>
    JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b));

export const couponMerchantContentEqual = merchantContentEqualFromPayload(couponPayload);

export const rewardMerchantContentEqual = merchantContentEqualFromPayload(rewardPayload);

export const streakMerchantContentEqual = merchantContentEqualFromPayload(streakPayload);

const isLoyaltyEntityExclusiveToStore = <T extends LoyaltyScopeEntity>(
  entity: T,
  storeId: string,
  globalById: Map<string, T>,
  merchantContentEqual: (a: T, b: T) => boolean,
): boolean => {
  const global = globalById.get(entity.id);
  if (!global || !merchantContentEqual(global, entity)) {
    return true;
  }
  const ids = entity.availableStoreIds;
  return ids?.length === 1 && ids[0] === storeId;
};

export const isCouponExclusiveToStore = (
  coupon: Coupon,
  storeId: string,
  globalById: Map<string, Coupon>,
): boolean =>
  isLoyaltyEntityExclusiveToStore(coupon, storeId, globalById, couponMerchantContentEqual);

export const isRewardExclusiveToStore = (
  reward: Reward,
  storeId: string,
  globalById: Map<string, Reward>,
): boolean =>
  isLoyaltyEntityExclusiveToStore(reward, storeId, globalById, rewardMerchantContentEqual);

export const resolveLoyaltyEntityScopeLabel = <T extends LoyaltyScopeEntity>(
  entity: T,
  selectedStoreId: string | null,
  selectedStoreName: string | undefined,
  globalById: Map<string, T>,
  getScopeLabel: (availableStoreIds: string[] | undefined | null) => string,
  t: TFunction,
  globalBaselineReady: boolean,
  merchantContentEqual: (a: T, b: T) => boolean,
): string => {
  if ((entity.availableStoreIds?.length ?? 0) > 0) {
    return getScopeLabel(entity.availableStoreIds);
  }
  if (!selectedStoreId || !selectedStoreName) {
    return getScopeLabel(entity.availableStoreIds);
  }
  if (!globalBaselineReady) {
    return getScopeLabel(entity.availableStoreIds);
  }
  const global = globalById.get(entity.id);
  if (!global) {
    return t("OperatorContext.storeContext", { storeName: selectedStoreName });
  }
  if (!merchantContentEqual(global, entity)) {
    return t("OperatorContext.storeContext", { storeName: selectedStoreName });
  }
  return getScopeLabel(entity.availableStoreIds);
};

export const resolveCouponScopeLabel = (
  coupon: Coupon,
  selectedStoreId: string | null,
  selectedStoreName: string | undefined,
  globalById: Map<string, Coupon>,
  getScopeLabel: (availableStoreIds: string[] | undefined | null) => string,
  t: TFunction,
  globalBaselineReady: boolean,
): string =>
  resolveLoyaltyEntityScopeLabel(
    coupon,
    selectedStoreId,
    selectedStoreName,
    globalById,
    getScopeLabel,
    t,
    globalBaselineReady,
    couponMerchantContentEqual,
  );

export const resolveStreakScopeLabel = (
  program: StreakProgram,
  selectedStoreId: string | null,
  selectedStoreName: string | undefined,
  globalById: Map<string, StreakProgram>,
  getScopeLabel: (availableStoreIds: string[] | undefined | null) => string,
  t: TFunction,
  globalBaselineReady: boolean,
): string =>
  resolveLoyaltyEntityScopeLabel(
    program,
    selectedStoreId,
    selectedStoreName,
    globalById,
    getScopeLabel,
    t,
    globalBaselineReady,
    streakMerchantContentEqual,
  );

export const resolveRewardScopeLabel = (
  reward: Reward,
  selectedStoreId: string | null,
  selectedStoreName: string | undefined,
  globalById: Map<string, Reward>,
  getScopeLabel: (availableStoreIds: string[] | undefined | null) => string,
  t: TFunction,
  globalBaselineReady: boolean,
): string =>
  resolveLoyaltyEntityScopeLabel(
    reward,
    selectedStoreId,
    selectedStoreName,
    globalById,
    getScopeLabel,
    t,
    globalBaselineReady,
    rewardMerchantContentEqual,
  );
