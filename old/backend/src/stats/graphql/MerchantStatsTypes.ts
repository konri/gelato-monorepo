import { Field, Float, ID, Int, ObjectType, registerEnumType } from 'type-graphql'
import GraphQLJSON from 'graphql-type-json'

export enum StatsTrendGranularity {
  day = 'day',
  week = 'week',
  month = 'month',
}

registerEnumType(StatsTrendGranularity, {
  name: 'StatsTrendGranularity',
  description: 'Bucket size for merchant stats trend time series',
})

export enum StatsCompareMode {
  none = 'none',
  previous_period = 'previous_period',
  previous_year = 'previous_year',
}

registerEnumType(StatsCompareMode, {
  name: 'StatsCompareMode',
  description: 'Comparison window for merchantStatsBundle',
})

export enum StatsStoreMetricCoverage {
  FULL_MERCHANT = 'FULL_MERCHANT',
  STORE_SCOPED_PARTIAL = 'STORE_SCOPED_PARTIAL',
}

registerEnumType(StatsStoreMetricCoverage, {
  name: 'StatsStoreMetricCoverage',
  description: 'Whether store filters apply uniformly across all stat blocks',
})

@ObjectType()
export class StatsPeriodBounds {
  @Field()
  from!: string

  @Field()
  to!: string
}

@ObjectType()
export class StatsUsers {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  distinctClientsWithStampCard!: number

  @Field(() => Int)
  distinctClientsActiveInPeriod!: number

  @Field(() => Int)
  newLoyaltyCardsIssuedInPeriod!: number

  @Field(() => Int)
  clientsWithFirstEverStampInPeriod!: number

  @Field(() => Int)
  distinctClientsWithPointBalance!: number

  @Field(() => Int)
  distinctClientsWithCouponUsageInPeriod!: number

  @Field(() => Int)
  distinctClientsWithStreakVisitInPeriod!: number

  @Field(() => Int)
  returningClientsActiveInPeriod!: number

  @Field(() => Int)
  newClientsFirstActivityInPeriod!: number

  @Field(() => Int)
  clientsActiveWithoutActivitySnapshot!: number
}

@ObjectType()
export class StatsCards {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  loyaltyCardsTotal!: number

  @Field(() => Int)
  loyaltyCardsActive!: number

  @Field(() => Int)
  loyaltyCardsCompleted!: number

  @Field(() => Int)
  loyaltyCardsAbandonedPartial!: number

  @Field(() => Int)
  loyaltyCardsIssuedInPeriod!: number

  @Field(() => Int)
  loyaltyCardsCompletedInPeriod!: number

  @Field(() => Float)
  averageStampsCollectedOnActiveCards!: number
}

@ObjectType()
export class StatsStamps {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  stampsEarnedTotalInPeriod!: number

  @Field(() => Int)
  stampEarnTransactionsInPeriod!: number

  @Field(() => Int)
  stampsUsedTotalInPeriod!: number

  @Field(() => Int)
  stampUsedTransactionsInPeriod!: number

  @Field(() => Int)
  stampsRefundedTotalInPeriod!: number

  @Field(() => Int)
  distinctCardsWithEarnedStampInPeriod!: number

  @Field(() => Float)
  averageEarnedStampsPerActiveCardInPeriod!: number

  @Field(() => Int)
  milestonesClaimedInPeriod!: number

  @Field(() => Int)
  milestonesRedeemedInPeriod!: number
}

@ObjectType()
export class StatsPoints {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  merchantPointsEarnedInPeriod!: number

  @Field(() => Int)
  merchantPointsSpentInPeriod!: number

  @Field(() => Int)
  merchantPointsRefundedInPeriod!: number

  @Field(() => Int)
  merchantPointsBonusInPeriod!: number

  @Field(() => Int)
  merchantPointsPenaltyInPeriod!: number

  @Field(() => Int)
  merchantPointLedgerRowsInPeriod!: number

  @Field(() => Int)
  distinctUsersWithMerchantPointLedgerInPeriod!: number

  @Field(() => Float)
  averageAvailablePointsPerBalance!: number

  @Field(() => Int)
  totalAvailablePointsLiability!: number

  @Field(() => Int)
  usersWithMerchantPointBalance!: number
}

@ObjectType()
export class StatsTopRewardRow {
  @Field(() => ID, { nullable: true })
  rewardId?: string | null

  @Field()
  title!: string

  @Field()
  sourceType!: string

  @Field(() => Int)
  count!: number
}

@ObjectType()
export class StatsRewards {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  userRewardsCreatedInPeriod!: number

  @Field(() => GraphQLJSON)
  userRewardsByStatusInPeriod!: Record<string, number>

  @Field(() => GraphQLJSON)
  userRewardsBySourceTypeInPeriod!: Record<string, number>

  @Field(() => Int)
  userRewardsRedeemedInPeriod!: number

  @Field(() => Int)
  userRewardsClaimedInPeriod!: number

  @Field(() => Int)
  userRewardsExpiredInPeriod!: number

  @Field(() => [StatsTopRewardRow])
  topRewardsInPeriod!: StatsTopRewardRow[]

  @Field(() => Float)
  redemptionRate!: number
}

@ObjectType()
export class StatsStampCardFunnel {
  @Field(() => Int)
  cardsTotal!: number

  @Field(() => Int)
  cardsWithAtLeastOneStamp!: number

  @Field(() => Int)
  cardsCompleted!: number

  @Field(() => Float)
  shareWithStamp!: number

  @Field(() => Float)
  shareCompleted!: number
}

@ObjectType()
export class StatsStampCardCohortFunnel {
  @Field(() => Int)
  cardsIssuedInPeriod!: number

  @Field(() => Int)
  cardsWithFirstStampInPeriod!: number

  @Field(() => Float)
  shareWithFirstStampInPeriod!: number
}

@ObjectType()
export class StatsCouponFunnel {
  @Field(() => Int)
  activeCouponsForMerchant!: number

  @Field(() => Int)
  userCouponsClaimedInPeriod!: number

  @Field(() => Int)
  couponUsagesInPeriod!: number

  @Field(() => Float)
  claimToUseRate!: number
}

@ObjectType()
export class StatsFunnels {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => StatsStampCardFunnel)
  stampCardFunnel!: StatsStampCardFunnel

  @Field(() => StatsStampCardCohortFunnel)
  stampCardCohortFunnel!: StatsStampCardCohortFunnel

  @Field(() => StatsCouponFunnel)
  couponFunnel!: StatsCouponFunnel
}

@ObjectType()
export class StatsOrdersTrendPoint {
  @Field()
  periodStart!: string

  @Field(() => Int)
  ordersCreated!: number
}

@ObjectType()
export class StatsOrdersTrends {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => StatsTrendGranularity)
  granularity!: StatsTrendGranularity

  @Field(() => [StatsOrdersTrendPoint])
  series!: StatsOrdersTrendPoint[]
}

@ObjectType()
export class MerchantStatsOrdersTrendsResult {
  @Field(() => StatsOrdersTrends)
  primary!: StatsOrdersTrends

  @Field(() => StatsOrdersTrends, { nullable: true })
  comparison?: StatsOrdersTrends | null
}

@ObjectType()
export class StatsStreakVisitsTrendPoint {
  @Field()
  periodStart!: string

  @Field(() => Int)
  streakVisits!: number
}

@ObjectType()
export class StatsStreakVisitsTrends {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => StatsTrendGranularity)
  granularity!: StatsTrendGranularity

  @Field(() => [StatsStreakVisitsTrendPoint])
  series!: StatsStreakVisitsTrendPoint[]
}

@ObjectType()
export class MerchantStatsStreakVisitsTrendsResult {
  @Field(() => StatsStreakVisitsTrends)
  primary!: StatsStreakVisitsTrends

  @Field(() => StatsStreakVisitsTrends, { nullable: true })
  comparison?: StatsStreakVisitsTrends | null
}

@ObjectType()
export class StatsLocationRow {
  @Field()
  merchantStoreId!: string

  @Field()
  storeName!: string

  @Field(() => String, { nullable: true })
  city?: string | null

  @Field(() => Int)
  ordersCreatedInPeriod!: number

  @Field(() => Int)
  usersWhoFavoritedStore!: number
}

@ObjectType()
export class StatsLocations {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => [StatsLocationRow])
  locations!: StatsLocationRow[]
}

@ObjectType()
export class StatsTopCouponRow {
  @Field()
  couponId!: string

  @Field()
  title!: string

  @Field()
  couponType!: string

  @Field(() => Int)
  usageCount!: number
}

@ObjectType()
export class StatsCoupons {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  totalCouponsConfigured!: number

  @Field(() => Int)
  activeCoupons!: number

  @Field(() => Int)
  userCouponsClaimedInPeriod!: number

  @Field(() => Int)
  userCouponsUsedInPeriod!: number

  @Field(() => Int)
  couponUsagesInPeriod!: number

  @Field(() => Int)
  distinctUsersWhoClaimed!: number

  @Field(() => Int)
  distinctUsersWhoUsed!: number

  @Field(() => Float)
  claimToUseRate!: number

  @Field(() => GraphQLJSON)
  byTypeInPeriod!: Record<string, { claimed: number; used: number }>

  @Field(() => [StatsTopCouponRow])
  topCouponsByUsage!: StatsTopCouponRow[]
}

@ObjectType()
export class StatsStreakProgramRow {
  @Field()
  streakProgramId!: string

  @Field()
  name!: string

  @Field(() => Int)
  visitsInPeriod!: number

  @Field(() => Int)
  distinctUsersInPeriod!: number

  @Field(() => Int)
  rewardClaimsInPeriod!: number
}

@ObjectType()
export class StatsStreaks {
  @Field(() => StatsPeriodBounds)
  period!: StatsPeriodBounds

  @Field()
  merchantId!: string

  @Field()
  storeScopeApplied!: boolean

  @Field(() => Int)
  activeStreakPrograms!: number

  @Field(() => Int)
  totalVisitsInPeriod!: number

  @Field(() => Int)
  distinctUsersWithVisitInPeriod!: number

  @Field(() => Int)
  totalRewardClaimsInPeriod!: number

  @Field(() => Float)
  averageCurrentStreak!: number

  @Field(() => Float)
  averageLongestStreak!: number

  @Field(() => [StatsStreakProgramRow])
  programBreakdown!: StatsStreakProgramRow[]
}

@ObjectType()
export class StatsMetricDeltaRow {
  @Field()
  path!: string

  @Field(() => Float)
  current!: number

  @Field(() => Float)
  previous!: number

  @Field(() => Float)
  delta!: number

  @Field(() => Float, { nullable: true })
  deltaPct!: number | null
}

@ObjectType()
export class StatsBundleAnalytics {
  @Field()
  generatedAt!: string

  @Field(() => StatsCompareMode)
  compareMode!: StatsCompareMode

  @Field(() => StatsPeriodBounds)
  primaryPeriod!: StatsPeriodBounds

  @Field(() => StatsPeriodBounds, { nullable: true })
  comparisonPeriod?: StatsPeriodBounds | null

  @Field(() => GraphQLJSON)
  filtersEcho!: Record<string, unknown>

  @Field(() => StatsStoreMetricCoverage)
  storeMetricCoverage!: StatsStoreMetricCoverage

  @Field(() => [String])
  dataScopeNotes!: string[]

  @Field(() => [StatsMetricDeltaRow], { nullable: true })
  metricDeltas?: StatsMetricDeltaRow[] | null
}

@ObjectType()
export class MerchantStatsBundle {
  @Field(() => StatsUsers)
  users!: StatsUsers

  @Field(() => StatsCards)
  cards!: StatsCards

  @Field(() => StatsStamps)
  stamps!: StatsStamps

  @Field(() => StatsPoints)
  points!: StatsPoints

  @Field(() => StatsRewards)
  rewards!: StatsRewards

  @Field(() => StatsFunnels)
  funnels!: StatsFunnels

  @Field(() => StatsLocations)
  locations!: StatsLocations

  @Field(() => StatsCoupons)
  coupons!: StatsCoupons

  @Field(() => StatsStreaks)
  streaks!: StatsStreaks

  @Field(() => StatsBundleAnalytics, { nullable: true })
  analytics?: StatsBundleAnalytics | null

  @Field(() => MerchantStatsBundle, { nullable: true })
  comparison?: MerchantStatsBundle | null
}
