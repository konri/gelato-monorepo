import type { TrendGranularity } from '../utils/trendGranularity'
import type { MerchantStatsBundlePayload } from '../services/merchantStatsBundleService'
import type { UsersStatsPayload } from '../services/usersStatsService'
import type { CardsStatsPayload } from '../services/cardsStatsService'
import type { StampsStatsPayload } from '../services/stampsStatsService'
import type { PointsStatsPayload } from '../services/pointsStatsService'
import type { RewardsStatsPayload } from '../services/rewardsStatsService'
import type { FunnelsStatsPayload } from '../services/funnelsStatsService'
import type { OrdersTrendStatsPayload, StreakVisitsTrendStatsPayload } from '../services/trendsStatsService'
import type { LocationsStatsPayload } from '../services/locationsStatsService'
import type { CouponsStatsPayload } from '../services/couponsStatsService'
import type { StreaksStatsPayload } from '../services/streaksStatsService'
import type { StatsCompareMode as StatsCompareModeInternal } from '../utils/statsComparisonRange'
import {
  MerchantStatsBundle,
  StatsCards,
  StatsCompareMode,
  StatsCoupons,
  StatsFunnels,
  StatsLocationRow,
  StatsLocations,
  StatsPeriodBounds,
  StatsPoints,
  StatsRewards,
  StatsStampCardCohortFunnel,
  StatsStampCardFunnel,
  StatsCouponFunnel,
  StatsStamps,
  StatsStreakProgramRow,
  StatsStreaks,
  StatsTopCouponRow,
  StatsTopRewardRow,
  StatsOrdersTrendPoint,
  StatsOrdersTrends,
  StatsStreakVisitsTrendPoint,
  StatsStreakVisitsTrends,
  StatsTrendGranularity,
  StatsUsers,
} from './MerchantStatsTypes'

function trendGranularityToGraphql(g: TrendGranularity): StatsTrendGranularity {
  switch (g) {
    case 'day':
      return StatsTrendGranularity.day
    case 'week':
      return StatsTrendGranularity.week
    case 'month':
      return StatsTrendGranularity.month
  }
}

export function periodOf(b: { from: string; to: string }): StatsPeriodBounds {
  return Object.assign(new StatsPeriodBounds(), b)
}

function toStatsUsers(p: UsersStatsPayload): StatsUsers {
  const o = new StatsUsers()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.distinctClientsWithStampCard = p.distinctClientsWithStampCard
  o.distinctClientsActiveInPeriod = p.distinctClientsActiveInPeriod
  o.newLoyaltyCardsIssuedInPeriod = p.newLoyaltyCardsIssuedInPeriod
  o.clientsWithFirstEverStampInPeriod = p.clientsWithFirstEverStampInPeriod
  o.distinctClientsWithPointBalance = p.distinctClientsWithPointBalance
  o.distinctClientsWithCouponUsageInPeriod = p.distinctClientsWithCouponUsageInPeriod
  o.distinctClientsWithStreakVisitInPeriod = p.distinctClientsWithStreakVisitInPeriod
  o.returningClientsActiveInPeriod = p.returningClientsActiveInPeriod
  o.newClientsFirstActivityInPeriod = p.newClientsFirstActivityInPeriod
  o.clientsActiveWithoutActivitySnapshot = p.clientsActiveWithoutActivitySnapshot
  return o
}

function toStatsCards(p: CardsStatsPayload): StatsCards {
  const o = new StatsCards()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.loyaltyCardsTotal = p.loyaltyCardsTotal
  o.loyaltyCardsActive = p.loyaltyCardsActive
  o.loyaltyCardsCompleted = p.loyaltyCardsCompleted
  o.loyaltyCardsAbandonedPartial = p.loyaltyCardsAbandonedPartial
  o.loyaltyCardsIssuedInPeriod = p.loyaltyCardsIssuedInPeriod
  o.loyaltyCardsCompletedInPeriod = p.loyaltyCardsCompletedInPeriod
  o.averageStampsCollectedOnActiveCards = p.averageStampsCollectedOnActiveCards
  return o
}

function toStatsStamps(p: StampsStatsPayload): StatsStamps {
  const o = new StatsStamps()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.stampsEarnedTotalInPeriod = p.stampsEarnedTotalInPeriod
  o.stampEarnTransactionsInPeriod = p.stampEarnTransactionsInPeriod
  o.stampsUsedTotalInPeriod = p.stampsUsedTotalInPeriod
  o.stampUsedTransactionsInPeriod = p.stampUsedTransactionsInPeriod
  o.stampsRefundedTotalInPeriod = p.stampsRefundedTotalInPeriod
  o.distinctCardsWithEarnedStampInPeriod = p.distinctCardsWithEarnedStampInPeriod
  o.averageEarnedStampsPerActiveCardInPeriod = p.averageEarnedStampsPerActiveCardInPeriod
  o.milestonesClaimedInPeriod = p.milestonesClaimedInPeriod
  o.milestonesRedeemedInPeriod = p.milestonesRedeemedInPeriod
  return o
}

function toStatsPoints(p: PointsStatsPayload): StatsPoints {
  const o = new StatsPoints()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.merchantPointsEarnedInPeriod = p.merchantPointsEarnedInPeriod
  o.merchantPointsSpentInPeriod = p.merchantPointsSpentInPeriod
  o.merchantPointsRefundedInPeriod = p.merchantPointsRefundedInPeriod
  o.merchantPointsBonusInPeriod = p.merchantPointsBonusInPeriod
  o.merchantPointsPenaltyInPeriod = p.merchantPointsPenaltyInPeriod
  o.merchantPointLedgerRowsInPeriod = p.merchantPointLedgerRowsInPeriod
  o.distinctUsersWithMerchantPointLedgerInPeriod = p.distinctUsersWithMerchantPointLedgerInPeriod
  o.averageAvailablePointsPerBalance = p.averageAvailablePointsPerBalance
  o.totalAvailablePointsLiability = Number(p.totalAvailablePointsLiability)
  o.usersWithMerchantPointBalance = p.usersWithMerchantPointBalance
  return o
}

function toStatsRewards(p: RewardsStatsPayload): StatsRewards {
  const o = new StatsRewards()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.userRewardsCreatedInPeriod = p.userRewardsCreatedInPeriod
  o.userRewardsByStatusInPeriod = { ...p.userRewardsByStatusInPeriod }
  o.userRewardsBySourceTypeInPeriod = { ...p.userRewardsBySourceTypeInPeriod }
  o.userRewardsRedeemedInPeriod = p.userRewardsRedeemedInPeriod
  o.userRewardsClaimedInPeriod = p.userRewardsClaimedInPeriod
  o.userRewardsExpiredInPeriod = p.userRewardsExpiredInPeriod
  o.topRewardsInPeriod = p.topRewardsInPeriod.map((r) => {
    const row = new StatsTopRewardRow()
    row.rewardId = r.rewardId
    row.title = r.title
    row.sourceType = r.sourceType
    row.count = r.count
    return row
  })
  o.redemptionRate = p.redemptionRate
  return o
}

function toStatsFunnels(p: FunnelsStatsPayload): StatsFunnels {
  const o = new StatsFunnels()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  const sc = new StatsStampCardFunnel()
  Object.assign(sc, p.stampCardFunnel)
  o.stampCardFunnel = sc
  const co = new StatsStampCardCohortFunnel()
  Object.assign(co, p.stampCardCohortFunnel)
  o.stampCardCohortFunnel = co
  const cf = new StatsCouponFunnel()
  Object.assign(cf, p.couponFunnel)
  o.couponFunnel = cf
  return o
}

export function toStatsOrdersTrends(p: OrdersTrendStatsPayload): StatsOrdersTrends {
  const o = new StatsOrdersTrends()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.granularity = trendGranularityToGraphql(p.granularity)
  o.series = p.series.map((s) => Object.assign(new StatsOrdersTrendPoint(), s))
  return o
}

export function toStatsStreakVisitsTrends(p: StreakVisitsTrendStatsPayload): StatsStreakVisitsTrends {
  const o = new StatsStreakVisitsTrends()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.granularity = trendGranularityToGraphql(p.granularity)
  o.series = p.series.map((s) => Object.assign(new StatsStreakVisitsTrendPoint(), s))
  return o
}

function toStatsLocations(p: LocationsStatsPayload): StatsLocations {
  const o = new StatsLocations()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.locations = p.locations.map((loc) => Object.assign(new StatsLocationRow(), loc))
  return o
}

function toStatsCoupons(p: CouponsStatsPayload): StatsCoupons {
  const o = new StatsCoupons()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.totalCouponsConfigured = p.totalCouponsConfigured
  o.activeCoupons = p.activeCoupons
  o.userCouponsClaimedInPeriod = p.userCouponsClaimedInPeriod
  o.userCouponsUsedInPeriod = p.userCouponsUsedInPeriod
  o.couponUsagesInPeriod = p.couponUsagesInPeriod
  o.distinctUsersWhoClaimed = p.distinctUsersWhoClaimed
  o.distinctUsersWhoUsed = p.distinctUsersWhoUsed
  o.claimToUseRate = p.claimToUseRate
  o.byTypeInPeriod = { ...p.byTypeInPeriod }
  o.topCouponsByUsage = p.topCouponsByUsage.map((c) => {
    const row = new StatsTopCouponRow()
    row.couponId = c.couponId
    row.title = c.title
    row.couponType = c.couponType
    row.usageCount = c.usageCount
    return row
  })
  return o
}

function toStatsStreaks(p: StreaksStatsPayload): StatsStreaks {
  const o = new StatsStreaks()
  o.period = periodOf(p.period)
  o.merchantId = p.merchantId
  o.storeScopeApplied = p.storeScopeApplied
  o.activeStreakPrograms = p.activeStreakPrograms
  o.totalVisitsInPeriod = p.totalVisitsInPeriod
  o.distinctUsersWithVisitInPeriod = p.distinctUsersWithVisitInPeriod
  o.totalRewardClaimsInPeriod = p.totalRewardClaimsInPeriod
  o.averageCurrentStreak = p.averageCurrentStreak
  o.averageLongestStreak = p.averageLongestStreak
  o.programBreakdown = p.programBreakdown.map((pr) => {
    const row = new StatsStreakProgramRow()
    row.streakProgramId = pr.streakProgramId
    row.name = pr.name
    row.visitsInPeriod = pr.visitsInPeriod
    row.distinctUsersInPeriod = pr.distinctUsersInPeriod
    row.rewardClaimsInPeriod = pr.rewardClaimsInPeriod
    return row
  })
  return o
}

export function payloadToBundle(p: MerchantStatsBundlePayload): MerchantStatsBundle {
  const bundle = new MerchantStatsBundle()
  bundle.users = toStatsUsers(p.users)
  bundle.cards = toStatsCards(p.cards)
  bundle.stamps = toStatsStamps(p.stamps)
  bundle.points = toStatsPoints(p.points)
  bundle.rewards = toStatsRewards(p.rewards)
  bundle.funnels = toStatsFunnels(p.funnels)
  bundle.locations = toStatsLocations(p.locations)
  bundle.coupons = toStatsCoupons(p.coupons)
  bundle.streaks = toStatsStreaks(p.streaks)
  return bundle
}

export function mapCompareMode(mode: StatsCompareModeInternal): StatsCompareMode {
  if (mode === 'previous_year') return StatsCompareMode.previous_year
  if (mode === 'previous_period') return StatsCompareMode.previous_period
  return StatsCompareMode.none
}
