import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { computeUsersStats, UsersStatsPayload } from './usersStatsService'
import { computeCardsStats, CardsStatsPayload } from './cardsStatsService'
import { computeStampsStats, StampsStatsPayload } from './stampsStatsService'
import { computePointsStats, PointsStatsPayload } from './pointsStatsService'
import { computeRewardsStats, RewardsStatsPayload } from './rewardsStatsService'
import { computeFunnelsStats, FunnelsStatsPayload } from './funnelsStatsService'
import { computeLocationsStats, LocationsStatsPayload } from './locationsStatsService'
import { computeCouponsStats, CouponsStatsPayload } from './couponsStatsService'
import { computeStreaksStats, StreaksStatsPayload } from './streaksStatsService'
import { fetchLoyaltyStampCardsForStats } from '../utils/loyaltyStampCardMetrics'

export type MerchantStatsBundlePayload = {
  users: UsersStatsPayload
  cards: CardsStatsPayload
  stamps: StampsStatsPayload
  points: PointsStatsPayload
  rewards: RewardsStatsPayload
  funnels: FunnelsStatsPayload
  locations: LocationsStatsPayload
  coupons: CouponsStatsPayload
  streaks: StreaksStatsPayload
}

export async function computeMerchantStatsBundlePayload(
  prisma: PrismaClient,
  ctx: StatsContext
): Promise<MerchantStatsBundlePayload> {
  const loyaltyCards = fetchLoyaltyStampCardsForStats(prisma, ctx.merchantId, ctx.loyaltyCardTemplateId)

  const [users, cards, stamps, points, rewards, funnels, locations, coupons, streaks] = await Promise.all([
    computeUsersStats(prisma, ctx),
    loyaltyCards.then((rows) => computeCardsStats(prisma, ctx, { loyaltyCards: rows })),
    computeStampsStats(prisma, ctx),
    computePointsStats(prisma, ctx),
    computeRewardsStats(prisma, ctx),
    loyaltyCards.then((rows) => computeFunnelsStats(prisma, ctx, { loyaltyCards: rows })),
    computeLocationsStats(prisma, ctx),
    computeCouponsStats(prisma, ctx),
    computeStreaksStats(prisma, ctx),
  ])

  return {
    users,
    cards,
    stamps,
    points,
    rewards,
    funnels,
    locations,
    coupons,
    streaks,
  }
}
