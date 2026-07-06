import type { TFunction } from "i18next";

const REWARD_STATUS_PREFIX = "rewards.userRewardsByStatusInPeriod.";
const REWARD_SOURCE_PREFIX = "rewards.userRewardsBySourceTypeInPeriod.";
const COUPON_TYPE_CLAIMED = /^coupons\.byTypeInPeriod\.(.+)\.claimed$/;
const COUPON_TYPE_USED = /^coupons\.byTypeInPeriod\.(.+)\.used$/;

const MERCHANT_STATS_DELTA_PATH_I18N_KEY: Record<string, string> = {
    "users.distinctClientsWithStampCard": "MerchantStats.kpiClientsWithCard",
    "users.distinctClientsActiveInPeriod": "MerchantStats.kpiActiveClients",
    "users.returningClientsActiveInPeriod": "MerchantStats.kpiReturningClients",
    "users.newClientsFirstActivityInPeriod": "MerchantStats.kpiNewClientsFirstActivity",
    "users.newLoyaltyCardsIssuedInPeriod": "MerchantStats.kpiNewCards",
    "users.clientsWithFirstEverStampInPeriod": "MerchantStats.kpiFirstStamp",
    "users.distinctClientsWithPointBalance": "MerchantStats.kpiPointsClients",
    "users.distinctClientsWithCouponUsageInPeriod": "MerchantStats.kpiCouponUsers",
    "users.distinctClientsWithStreakVisitInPeriod": "MerchantStats.kpiStreakUsers",
    "users.clientsActiveWithoutActivitySnapshot": "MerchantStats.deltaUsersSnapshotGap",
    "cards.loyaltyCardsIssuedInPeriod": "MerchantStats.kpiCardsIssuedPeriod",
    "cards.loyaltyCardsCompletedInPeriod": "MerchantStats.kpiCardsCompletedPeriod",
    "cards.loyaltyCardsTotal": "MerchantStats.kpiCardsTotal",
    "cards.loyaltyCardsActive": "MerchantStats.deltaCardsActive",
    "cards.loyaltyCardsCompleted": "MerchantStats.deltaCardsCompletedAll",
    "cards.loyaltyCardsAbandonedPartial": "MerchantStats.kpiCardsAbandonedPartial",
    "cards.averageStampsCollectedOnActiveCards": "MerchantStats.kpiAvgStampsActive",
    "stamps.stampsEarnedTotalInPeriod": "MerchantStats.kpiStampsEarned",
    "stamps.stampEarnTransactionsInPeriod": "MerchantStats.deltaStampEarnTx",
    "stamps.stampsUsedTotalInPeriod": "MerchantStats.deltaStampsUsedTotal",
    "stamps.stampUsedTransactionsInPeriod": "MerchantStats.deltaStampUsedTx",
    "stamps.stampsRefundedTotalInPeriod": "MerchantStats.deltaStampsRefunded",
    "stamps.distinctCardsWithEarnedStampInPeriod": "MerchantStats.deltaDistinctCardsEarnedStamp",
    "stamps.averageEarnedStampsPerActiveCardInPeriod": "MerchantStats.deltaAvgEarnedStampsPerActiveCard",
    "stamps.milestonesClaimedInPeriod": "MerchantStats.kpiMilestonesClaimed",
    "stamps.milestonesRedeemedInPeriod": "MerchantStats.kpiMilestonesRedeemed",
    "points.merchantPointsEarnedInPeriod": "MerchantStats.kpiPointsEarned",
    "points.merchantPointsSpentInPeriod": "MerchantStats.kpiPointsSpent",
    "points.merchantPointsRefundedInPeriod": "MerchantStats.deltaPointsRefunded",
    "points.merchantPointsBonusInPeriod": "MerchantStats.deltaPointsBonus",
    "points.merchantPointsPenaltyInPeriod": "MerchantStats.deltaPointsPenalty",
    "points.merchantPointLedgerRowsInPeriod": "MerchantStats.pointsLedgerRows",
    "points.distinctUsersWithMerchantPointLedgerInPeriod": "MerchantStats.kpiPointsUsers",
    "points.averageAvailablePointsPerBalance": "MerchantStats.deltaPointsAvgBalance",
    "points.totalAvailablePointsLiability": "MerchantStats.kpiPointsLiability",
    "points.usersWithMerchantPointBalance": "MerchantStats.deltaPointsUsersWithBalance",
    "rewards.userRewardsCreatedInPeriod": "MerchantStats.kpiRewardsCreated",
    "rewards.userRewardsRedeemedInPeriod": "MerchantStats.kpiRewardsRedeemed",
    "rewards.userRewardsClaimedInPeriod": "MerchantStats.deltaRewardsClaimed",
    "rewards.userRewardsExpiredInPeriod": "MerchantStats.deltaRewardsExpired",
    "rewards.redemptionRate": "MerchantStats.deltaRewardsRedemptionRate",
    "coupons.totalCouponsConfigured": "MerchantStats.deltaCouponTotalConfigured",
    "coupons.activeCoupons": "MerchantStats.deltaCouponActive",
    "coupons.userCouponsClaimedInPeriod": "MerchantStats.kpiCouponsClaimed",
    "coupons.userCouponsUsedInPeriod": "MerchantStats.deltaCouponUserUsed",
    "coupons.couponUsagesInPeriod": "MerchantStats.kpiCouponsUsed",
    "coupons.distinctUsersWhoClaimed": "MerchantStats.deltaCouponDistinctClaimed",
    "coupons.distinctUsersWhoUsed": "MerchantStats.deltaCouponDistinctUsed",
    "coupons.claimToUseRate": "MerchantStats.kpiClaimToUse",
    "streaks.activeStreakPrograms": "MerchantStats.streakProgramsActive",
    "streaks.totalVisitsInPeriod": "MerchantStats.kpiStreakVisits",
    "streaks.distinctUsersWithVisitInPeriod": "MerchantStats.kpiStreakDistinctUsers",
    "streaks.totalRewardClaimsInPeriod": "MerchantStats.kpiStreakRewards",
    "streaks.averageCurrentStreak": "MerchantStats.deltaStreakAvgCurrent",
    "streaks.averageLongestStreak": "MerchantStats.deltaStreakAvgLongest",
    "funnels.stampCardFunnel.cardsTotal": "MerchantStats.funnelCardsTotal",
    "funnels.stampCardFunnel.cardsWithAtLeastOneStamp": "MerchantStats.funnelWithStamp",
    "funnels.stampCardFunnel.cardsCompleted": "MerchantStats.funnelCompleted",
    "funnels.stampCardFunnel.shareWithStamp": "MerchantStats.funnelShareStampShort",
    "funnels.stampCardFunnel.shareCompleted": "MerchantStats.funnelShareCompletedShort",
    "funnels.stampCardCohortFunnel.cardsIssuedInPeriod": "MerchantStats.funnelCohortIssuedShort",
    "funnels.stampCardCohortFunnel.cardsWithFirstStampInPeriod": "MerchantStats.funnelCohortFirstStampShort",
    "funnels.stampCardCohortFunnel.shareWithFirstStampInPeriod": "MerchantStats.funnelCohortShareShort",
    "funnels.couponFunnel.activeCouponsForMerchant": "MerchantStats.funnelActiveCoupons",
    "funnels.couponFunnel.userCouponsClaimedInPeriod": "MerchantStats.funnelClaimed",
    "funnels.couponFunnel.couponUsagesInPeriod": "MerchantStats.funnelUsages",
    "funnels.couponFunnel.claimToUseRate": "MerchantStats.kpiClaimToUse",
    "trends.seriesSum.loyaltyCardsCreated": "MerchantStats.trendSumLoyaltyCardsCreated",
    "trends.seriesSum.stampsEarnedUnits": "MerchantStats.trendSumStamps",
    "trends.seriesSum.merchantPointsEarnedUnits": "MerchantStats.trendSumPointsEarned",
    "trends.seriesSum.ordersCreated": "MerchantStats.trendSumOrders",
    "trends.seriesSum.couponsClaimedByUsers": "MerchantStats.trendSumCoupons",
    "trends.seriesSum.couponUsages": "MerchantStats.trendSumCouponUsages",
    "trends.seriesSum.rewardsRedeemed": "MerchantStats.trendSumRewardsRedeemed",
    "trends.seriesSum.streakVisits": "MerchantStats.trendSumStreakVisits",
};

export const merchantStatsMetricDeltaPathLabel = (path: string, t: TFunction): string => {
  const i18nKey = MERCHANT_STATS_DELTA_PATH_I18N_KEY[path];
  if (i18nKey) {
    return t(i18nKey);
  }

  if (path.startsWith(REWARD_STATUS_PREFIX)) {
    const code = path.slice(REWARD_STATUS_PREFIX.length);
    return t("MerchantStats.deltaRewardStatus", { status: code });
  }
  if (path.startsWith(REWARD_SOURCE_PREFIX)) {
    const code = path.slice(REWARD_SOURCE_PREFIX.length);
    return t("MerchantStats.deltaRewardSource", { source: code });
  }

  const claimedMatch = path.match(COUPON_TYPE_CLAIMED);
  if (claimedMatch) {
    return t("MerchantStats.deltaCouponTypeClaimed", { type: claimedMatch[1] });
  }
  const usedMatch = path.match(COUPON_TYPE_USED);
  if (usedMatch) {
    return t("MerchantStats.deltaCouponTypeUsed", { type: usedMatch[1] });
  }

  return t("MerchantStats.deltaPathUnknown", { path });
};
