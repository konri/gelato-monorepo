import type {
  MerchantStatsBundleCoreData,
  MerchantStatsBundleData,
} from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { CouponsStatsPayload, RewardsStatsPayload } from "@/shared/api-client/src/stats/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toFiniteNumberOrNull = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const normalizeCouponsByType = (
  coupons: CouponsStatsPayload,
): CouponsStatsPayload => {
  const rawByType = coupons.byTypeInPeriod;
  if (!isRecord(rawByType)) {
    return coupons;
  }
  const byTypeInPeriod: Record<string, { claimed: number; used: number }> = {};
  for (const [key, value] of Object.entries(rawByType)) {
    if (!isRecord(value)) {
      continue;
    }
    byTypeInPeriod[key] = {
      claimed: Number(value.claimed ?? 0),
      used: Number(value.used ?? 0),
    };
  }
  return {
    ...coupons,
    byTypeInPeriod,
  };
};

const normalizeRewards = (rewards: RewardsStatsPayload): RewardsStatsPayload => ({
  ...rewards,
  topRewardsInPeriod: rewards.topRewardsInPeriod.map((row) => ({
    ...row,
    redemptionRate: toFiniteNumberOrNull(row.redemptionRate),
  })),
});

const normalizeCore = (core: MerchantStatsBundleCoreData): MerchantStatsBundleCoreData => ({
  ...core,
  coupons: normalizeCouponsByType(core.coupons),
  rewards: normalizeRewards(core.rewards),
});

export const normalizeMerchantStatsBundle = (
  bundle: MerchantStatsBundleData,
): MerchantStatsBundleData => {
  const next: MerchantStatsBundleData = {
    ...normalizeCore(bundle),
    analytics: bundle.analytics ?? null,
    comparison: bundle.comparison ? normalizeCore(bundle.comparison) : null,
  };
  return next;
};
