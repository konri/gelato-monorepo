import type {
  CardsStatsPayload,
  CouponsStatsPayload,
  FunnelsStatsPayload,
  LocationsStatsPayload,
  MerchantStatsAnalyticsPayload,
  PointsStatsPayload,
  RewardsStatsPayload,
  StampsStatsPayload,
  StatsCompareMode,
  StreaksStatsPayload,
  TrendGranularity,
  TrendsStatsPayload,
  UsersStatsPayload,
} from "../../../stats/types";

export type OrdersTrendStatsPayload = {
  period: TrendsStatsPayload["period"];
  merchantId: string;
  storeScopeApplied: boolean;
  granularity: TrendGranularity;
  series: { periodStart: string; ordersCreated: number }[];
};

export type StreakVisitsTrendStatsPayload = {
  period: TrendsStatsPayload["period"];
  merchantId: string;
  storeScopeApplied: boolean;
  granularity: TrendGranularity;
  series: { periodStart: string; streakVisits: number }[];
};

export type MerchantStatsBundleCoreData = {
  users: UsersStatsPayload;
  cards: CardsStatsPayload;
  stamps: StampsStatsPayload;
  points: PointsStatsPayload;
  rewards: RewardsStatsPayload;
  funnels: FunnelsStatsPayload;
  trends: TrendsStatsPayload;
  locations: LocationsStatsPayload;
  coupons: CouponsStatsPayload;
  streaks: StreaksStatsPayload;
};

export type MerchantStatsBundleCoreWithoutTrends = Omit<MerchantStatsBundleCoreData, "trends">;

export type MerchantStatsBundleData = MerchantStatsBundleCoreData & {
  analytics?: MerchantStatsAnalyticsPayload | null;
  comparison?: MerchantStatsBundleCoreData | null;
};

export type MerchantStatsBundleGraphqlResponse = MerchantStatsBundleCoreWithoutTrends & {
  analytics?: MerchantStatsBundleData["analytics"];
  comparison?: MerchantStatsBundleCoreWithoutTrends | null;
};

export type MerchantStatsBundleQueryVariables = {
  from?: string;
  to?: string;
  merchantId?: string;
  storeId?: string;
  storeIds?: string[];
  loyaltyCardTemplateId?: string;
  streakProgramId?: string;
  compareMode?: StatsCompareMode;
};

export type MerchantStatsBundleQueryResult = {
  merchantStatsBundle: MerchantStatsBundleGraphqlResponse;
};

export type MerchantStatsTrendWindowVariables = MerchantStatsBundleQueryVariables & {
  granularity: TrendGranularity;
};

export type MerchantStatsOrdersTrendsQueryData = {
  primary: OrdersTrendStatsPayload;
  comparison?: OrdersTrendStatsPayload | null;
};

export type MerchantStatsStreakVisitsTrendsQueryData = {
  primary: StreakVisitsTrendStatsPayload;
  comparison?: StreakVisitsTrendStatsPayload | null;
};

export type MerchantStatsTrendOrdersQueryResult = {
  merchantStatsTrendOrders: MerchantStatsOrdersTrendsQueryData;
};

export type MerchantStatsTrendStreakVisitsQueryResult = {
  merchantStatsTrendStreakVisits: MerchantStatsStreakVisitsTrendsQueryData;
};
