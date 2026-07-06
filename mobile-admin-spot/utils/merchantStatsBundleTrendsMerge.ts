import type {
  MerchantStatsBundleData,
  MerchantStatsBundleGraphqlResponse,
  MerchantStatsOrdersTrendsQueryData,
  MerchantStatsStreakVisitsTrendsQueryData,
  OrdersTrendStatsPayload,
  StreakVisitsTrendStatsPayload,
} from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { DeepPartial } from "@apollo/client/utilities";
import type { TrendGranularity, TrendsStatsPayload } from "@/shared/api-client/src/stats/types";
import { isPlainObject } from "@/utils/isPlainObject";

const GRAPHQL_BASE_KEYS = [
  "users",
  "cards",
  "stamps",
  "points",
  "rewards",
  "funnels",
  "locations",
  "coupons",
  "streaks",
] as const;

function hasMetricBlocks(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => {
    const block = value[key];
    return typeof block === "object" && block !== null;
  });
}

function isTrendGranularity(value: unknown): value is TrendGranularity {
  return value === "day" || value === "week" || value === "month";
}

const isMerchantStatsBundleGraphqlResponse = (
  value:
    | MerchantStatsBundleGraphqlResponse
    | DeepPartial<MerchantStatsBundleGraphqlResponse>
    | null
    | undefined,
): value is MerchantStatsBundleGraphqlResponse => {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!hasMetricBlocks(value, GRAPHQL_BASE_KEYS)) {
    return false;
  }
  const cmp = value.comparison;
  if (cmp != null) {
    if (!isPlainObject(cmp) || !hasMetricBlocks(cmp, GRAPHQL_BASE_KEYS)) {
      return false;
    }
  }
  return true;
};

function isTrendStatsSeriesBlock(
  value: unknown,
  metricKey: "ordersCreated" | "streakVisits",
): boolean {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!isPlainObject(value.period)) {
    return false;
  }
  if (typeof value.period.from !== "string" || typeof value.period.to !== "string") {
    return false;
  }
  if (typeof value.merchantId !== "string") {
    return false;
  }
  if (typeof value.storeScopeApplied !== "boolean") {
    return false;
  }
  if (!isTrendGranularity(value.granularity)) {
    return false;
  }
  if (!Array.isArray(value.series)) {
    return false;
  }
  return value.series.every((r) => {
    if (!isPlainObject(r) || typeof r.periodStart !== "string") {
      return false;
    }
    const metric = r[metricKey];
    return typeof metric === "number";
  });
}

function isOrdersTrendBlockShape(value: unknown): value is OrdersTrendStatsPayload {
  return isTrendStatsSeriesBlock(value, "ordersCreated");
}

function isStreakTrendBlockShape(value: unknown): value is StreakVisitsTrendStatsPayload {
  return isTrendStatsSeriesBlock(value, "streakVisits");
}

const isMerchantStatsOrdersTrendsQueryData = (
  value:
    | MerchantStatsOrdersTrendsQueryData
    | DeepPartial<MerchantStatsOrdersTrendsQueryData>
    | null
    | undefined,
): value is MerchantStatsOrdersTrendsQueryData => {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!isOrdersTrendBlockShape(value.primary)) {
    return false;
  }
  const cmp = value.comparison;
  if (cmp != null && !isOrdersTrendBlockShape(cmp)) {
    return false;
  }
  return true;
};

const isMerchantStatsStreakVisitsTrendsQueryData = (
  value:
    | MerchantStatsStreakVisitsTrendsQueryData
    | DeepPartial<MerchantStatsStreakVisitsTrendsQueryData>
    | null
    | undefined,
): value is MerchantStatsStreakVisitsTrendsQueryData => {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!isStreakTrendBlockShape(value.primary)) {
    return false;
  }
  const cmp = value.comparison;
  if (cmp != null && !isStreakTrendBlockShape(cmp)) {
    return false;
  }
  return true;
};

export type NarrowedMerchantStatsSlices = {
  bundle: MerchantStatsBundleGraphqlResponse;
  orders: MerchantStatsOrdersTrendsQueryData;
  streak: MerchantStatsStreakVisitsTrendsQueryData;
};

export const narrowMerchantStatsSlices = (
  rawBundle:
    | MerchantStatsBundleGraphqlResponse
    | DeepPartial<MerchantStatsBundleGraphqlResponse>
    | null
    | undefined,
  rawOrders:
    | MerchantStatsOrdersTrendsQueryData
    | DeepPartial<MerchantStatsOrdersTrendsQueryData>
    | null
    | undefined,
  rawStreak:
    | MerchantStatsStreakVisitsTrendsQueryData
    | DeepPartial<MerchantStatsStreakVisitsTrendsQueryData>
    | null
    | undefined,
): NarrowedMerchantStatsSlices | null => {
  if (rawBundle == null || rawOrders == null || rawStreak == null) {
    return null;
  }
  if (
    !isMerchantStatsBundleGraphqlResponse(rawBundle) ||
    !isMerchantStatsOrdersTrendsQueryData(rawOrders) ||
    !isMerchantStatsStreakVisitsTrendsQueryData(rawStreak)
  ) {
    return null;
  }
  return { bundle: rawBundle, orders: rawOrders, streak: rawStreak };
};

function mergeOrderAndStreakTrendWindows(
  orders: OrdersTrendStatsPayload,
  streak: StreakVisitsTrendStatsPayload,
): TrendsStatsPayload {
  const orderMap = new Map(orders.series.map((p) => [p.periodStart, p.ordersCreated]));
  const streakMap = new Map(streak.series.map((p) => [p.periodStart, p.streakVisits]));
  const keys = new Set([...orderMap.keys(), ...streakMap.keys()]);
  const series = [...keys].sort().map((periodStart) => ({
    periodStart,
    loyaltyCardsCreated: 0,
    stampsEarnedUnits: 0,
    merchantPointsEarnedUnits: 0,
    ordersCreated: orderMap.get(periodStart) ?? 0,
    couponsClaimedByUsers: 0,
    couponUsages: 0,
    rewardsRedeemed: 0,
    streakVisits: streakMap.get(periodStart) ?? 0,
  }));
  return {
    period: orders.period,
    merchantId: orders.merchantId,
    storeScopeApplied: orders.storeScopeApplied,
    granularity: orders.granularity,
    series,
  };
}

export const mergeMerchantStatsBundleWithSplitTrends = (
  bundle: MerchantStatsBundleGraphqlResponse,
  orders: MerchantStatsOrdersTrendsQueryData,
  streak: MerchantStatsStreakVisitsTrendsQueryData,
): MerchantStatsBundleData | null => {
  const primaryTrends = mergeOrderAndStreakTrendWindows(orders.primary, streak.primary);

  const comparisonCore = bundle.comparison;
  let comparisonMerged: MerchantStatsBundleData["comparison"] = null;
  if (comparisonCore) {
    if (orders.comparison == null || streak.comparison == null) {
      return null;
    }
    comparisonMerged = {
      ...comparisonCore,
      trends: mergeOrderAndStreakTrendWindows(orders.comparison, streak.comparison),
    };
  }

  return {
    ...bundle,
    trends: primaryTrends,
    comparison: comparisonMerged,
  };
};
