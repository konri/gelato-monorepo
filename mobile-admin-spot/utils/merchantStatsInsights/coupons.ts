import {
  STATS_INSIGHT_CLAIM_TO_USE_GOOD,
  STATS_INSIGHT_CLAIM_TO_USE_WARN,
  STATS_INSIGHT_COMPARE_DELTA_PCT_WARN,
  STATS_INSIGHT_MIN_COUPON_CLAIMED,
} from "@/constants/merchantStatsInsightThresholds";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";

import { deltaPctIfAtMost, pickTopInsights } from "./pickTopInsights";
import type { MerchantStatsInsightItem } from "./types";

export const collectCouponsInsightCandidates = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] => {
  const items: MerchantStatsInsightItem[] = [];
  const funnel = bundle.funnels?.couponFunnel;
  const coupons = bundle.coupons;
  const showCompare = bundle.analytics?.compareMode !== "none";
  const deltas = bundle.analytics?.metricDeltas ?? [];

  if (funnel && funnel.userCouponsClaimedInPeriod >= STATS_INSIGHT_MIN_COUPON_CLAIMED) {
    const rate = funnel.claimToUseRate;
    if (rate < STATS_INSIGHT_CLAIM_TO_USE_WARN) {
      items.push({
        priority: 86,
        variant: "warn",
        titleKey: "MerchantStats.insightCouponClaimUseLowTitle",
        bodyKey: "MerchantStats.insightCouponClaimUseLowBody",
        params: {
          percent: Math.round(rate * 100),
          claimed: funnel.userCouponsClaimedInPeriod,
          used: funnel.couponUsagesInPeriod,
        },
      });
    } else if (rate >= STATS_INSIGHT_CLAIM_TO_USE_GOOD) {
      items.push({
        priority: 38,
        variant: "good",
        titleKey: "MerchantStats.insightCouponClaimUseGoodTitle",
        bodyKey: "MerchantStats.insightCouponClaimUseGoodBody",
        params: { percent: Math.round(rate * 100) },
      });
    }
  }

  if (coupons?.topCouponsByUsage && coupons.topCouponsByUsage.length >= 2) {
    const totalUsage = coupons.topCouponsByUsage.reduce(
      (acc, r) => acc + (Number.isFinite(r.usageCount) ? r.usageCount : 0),
      0,
    );
    if (totalUsage >= STATS_INSIGHT_MIN_COUPON_CLAIMED) {
      const top = coupons.topCouponsByUsage[0];
      const topShare = top ? top.usageCount / totalUsage : 0;
      if (topShare >= 0.55 && top) {
        items.push({
          priority: 50,
          variant: "info",
          titleKey: "MerchantStats.insightCouponConcentrationTitle",
          bodyKey: "MerchantStats.insightCouponConcentrationBody",
          params: {
            percent: Math.round(topShare * 100),
            title: top.title,
          },
        });
      }
    }
  }

  if (showCompare) {
    const row = deltas.find((d) => d.path === "funnels.couponFunnel.claimToUseRate");
    const dp = row ? deltaPctIfAtMost(row.deltaPct, STATS_INSIGHT_COMPARE_DELTA_PCT_WARN) : undefined;
    if (dp !== undefined) {
      items.push({
        priority: 91,
        variant: "bad",
        titleKey: "MerchantStats.insightCompareClaimUseDownTitle",
        bodyKey: "MerchantStats.insightCompareClaimUseDownBody",
        params: { deltaPct: Math.round(Math.abs(dp) * 100) },
      });
    }
  }

  return items;
};

export const buildCouponsStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] =>
  pickTopInsights(collectCouponsInsightCandidates(bundle));
