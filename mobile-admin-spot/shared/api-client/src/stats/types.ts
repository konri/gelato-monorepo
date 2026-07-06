export type StatsPeriodBounds = {
  from: string;
  to: string;
};

export type TrendGranularity = "day" | "week" | "month";

export type StatsCompareMode = "none" | "previous_period" | "previous_year";

export type StatsStoreMetricCoverage = "FULL_MERCHANT" | "STORE_SCOPED_PARTIAL";

export type MerchantStatsMetricDeltaRow = {
  path: string;
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
};

export type MerchantStatsAnalyticsPayload = {
  generatedAt: string;
  compareMode: StatsCompareMode;
  primaryPeriod: StatsPeriodBounds;
  comparisonPeriod: StatsPeriodBounds | null;
  filtersEcho: unknown;
  storeMetricCoverage: StatsStoreMetricCoverage;
  dataScopeNotes?: string[];
  metricDeltas?: MerchantStatsMetricDeltaRow[];
};

export type UsersStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  distinctClientsWithStampCard: number;
  distinctClientsActiveInPeriod: number;
  returningClientsActiveInPeriod?: number | null;
  newClientsFirstActivityInPeriod?: number | null;
  clientsActiveWithoutActivitySnapshot?: number | null;
  newLoyaltyCardsIssuedInPeriod: number;
  clientsWithFirstEverStampInPeriod: number;
  distinctClientsWithPointBalance: number;
  distinctClientsWithCouponUsageInPeriod: number;
  distinctClientsWithStreakVisitInPeriod: number;
};

export type CardsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  loyaltyCardsTotal: number;
  loyaltyCardsActive: number;
  loyaltyCardsCompleted: number;
  loyaltyCardsAbandonedPartial: number;
  loyaltyCardsIssuedInPeriod: number;
  loyaltyCardsCompletedInPeriod: number;
  averageStampsCollectedOnActiveCards: number;
};

export type StampsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  stampsEarnedTotalInPeriod: number;
  stampEarnTransactionsInPeriod: number;
  stampsUsedTotalInPeriod: number;
  stampUsedTransactionsInPeriod: number;
  stampsRefundedTotalInPeriod: number;
  distinctCardsWithEarnedStampInPeriod: number;
  averageEarnedStampsPerActiveCardInPeriod: number;
  milestonesClaimedInPeriod: number;
  milestonesRedeemedInPeriod: number;
};

export type PointsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  merchantPointsEarnedInPeriod: number;
  merchantPointsSpentInPeriod: number;
  merchantPointsRefundedInPeriod: number;
  merchantPointsBonusInPeriod: number;
  merchantPointsPenaltyInPeriod: number;
  merchantPointLedgerRowsInPeriod: number;
  distinctUsersWithMerchantPointLedgerInPeriod: number;
  averageAvailablePointsPerBalance: number;
  totalAvailablePointsLiability: number;
  usersWithMerchantPointBalance: number;
};

export type TopRewardRow = {
  rewardId: string | null;
  title: string;
  sourceType: string;
  count: number;
  redemptionRate?: number | null;
};

export type RewardsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  userRewardsCreatedInPeriod: number;
  userRewardsByStatusInPeriod: Record<string, number>;
  userRewardsBySourceTypeInPeriod: Record<string, number>;
  userRewardsRedeemedInPeriod: number;
  userRewardsClaimedInPeriod: number;
  userRewardsExpiredInPeriod: number;
  topRewardsInPeriod: TopRewardRow[];
  redemptionRate: number;
};

export type FunnelsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  stampCardFunnel: {
    cardsTotal: number;
    cardsWithAtLeastOneStamp: number;
    cardsCompleted: number;
    shareWithStamp: number;
    shareCompleted: number;
  };
  stampCardCohortFunnel: {
    cardsIssuedInPeriod: number;
    cardsWithFirstStampInPeriod: number;
    shareWithFirstStampInPeriod: number;
  };
  couponFunnel: {
    activeCouponsForMerchant: number;
    userCouponsClaimedInPeriod: number;
    couponUsagesInPeriod: number;
    claimToUseRate: number;
  };
};

export type TrendPoint = {
  periodStart: string;
  loyaltyCardsCreated: number;
  stampsEarnedUnits: number;
  merchantPointsEarnedUnits: number;
  ordersCreated: number;
  couponsClaimedByUsers: number;
  couponUsages: number;
  rewardsRedeemed: number;
  streakVisits: number;
};

export type TrendsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  granularity: TrendGranularity;
  series: TrendPoint[];
};

export type LocationMetricRow = {
  merchantStoreId: string;
  storeName: string;
  city: string | null;
  ordersCreatedInPeriod: number;
  usersWhoFavoritedStore: number;
};

export type LocationsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  locations: LocationMetricRow[];
};

export type TopCouponRow = {
  couponId: string;
  title: string;
  couponType: string;
  usageCount: number;
};

export type CouponsStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  totalCouponsConfigured: number;
  activeCoupons: number;
  userCouponsClaimedInPeriod: number;
  userCouponsUsedInPeriod: number;
  couponUsagesInPeriod: number;
  distinctUsersWhoClaimed: number;
  distinctUsersWhoUsed: number;
  claimToUseRate: number;
  byTypeInPeriod: Record<string, { claimed: number; used: number }>;
  topCouponsByUsage: TopCouponRow[];
};

export type StreakProgramRow = {
  streakProgramId: string;
  name: string;
  visitsInPeriod: number;
  distinctUsersInPeriod: number;
  rewardClaimsInPeriod: number;
};

export type StreaksStatsPayload = {
  period: StatsPeriodBounds;
  merchantId: string;
  storeScopeApplied: boolean;
  activeStreakPrograms: number;
  totalVisitsInPeriod: number;
  distinctUsersWithVisitInPeriod: number;
  totalRewardClaimsInPeriod: number;
  averageCurrentStreak: number;
  averageLongestStreak: number;
  programBreakdown: StreakProgramRow[];
};

