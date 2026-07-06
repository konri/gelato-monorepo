import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'

export type TopRewardRow = {
  rewardId: string | null
  title: string
  sourceType: string
  count: number
}

export type RewardsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  userRewardsCreatedInPeriod: number
  userRewardsByStatusInPeriod: Record<string, number>
  userRewardsBySourceTypeInPeriod: Record<string, number>
  userRewardsRedeemedInPeriod: number
  userRewardsClaimedInPeriod: number
  userRewardsExpiredInPeriod: number
  topRewardsInPeriod: TopRewardRow[]
  redemptionRate: number
  // ⚠️ [WYMAGA ROZSZERZENIA] średni czas karta → pierwsza nagroda:
  //   Wymaga korelacji LoyaltyStampCard.createdAt z UserReward(sourceType=STAMP_MAIN, createdAt).
  //   Powiązanie istnieje przez sourceEntityId = cardId, ale NIE jest wymuszone FK.
  //   Ryzyko: niespójne sourceEntityId → nieprawdziwy wynik.
  //   Rozwiązanie: dodać FK `stampCardId` do UserReward lub dedykowany widok.
}

/**
 * User-facing rewards (`UserReward`) for a merchant — with classification by status, source, and top ranking.
 */
export async function computeRewardsStats(prisma: PrismaClient, ctx: StatsContext): Promise<RewardsStatsPayload> {
  const { merchantId, from, to, storeIds } = ctx

  const [created, byStatusRows, bySourceTypeRows, redeemed, claimed, expired, topRewardsRows] = await Promise.all([
    prisma.userReward.count({
      where: { merchantId, createdAt: { gte: from, lte: to } },
    }),
    prisma.userReward.groupBy({
      by: ['status'],
      where: { merchantId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.userReward.groupBy({
      by: ['sourceType'],
      where: { merchantId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.userReward.count({
      where: { merchantId, status: 'REDEEMED', redeemedAt: { gte: from, lte: to } },
    }),
    prisma.userReward.count({
      where: { merchantId, claimedAt: { gte: from, lte: to } },
    }),
    prisma.userReward.count({
      where: { merchantId, status: 'EXPIRED', expiresAt: { gte: from, lte: to } },
    }),
    prisma.userReward.groupBy({
      by: ['rewardId', 'title', 'sourceType'],
      where: { merchantId, createdAt: { gte: from, lte: to } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of byStatusRows) {
    byStatus[row.status] = row._count._all
  }
  const bySourceType: Record<string, number> = {}
  for (const row of bySourceTypeRows) {
    bySourceType[row.sourceType] = row._count._all
  }

  const topRewardsInPeriod: TopRewardRow[] = topRewardsRows.map((r) => ({
    rewardId: r.rewardId,
    title: r.title,
    sourceType: r.sourceType,
    count: r._count.id,
  }))

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    userRewardsCreatedInPeriod: created,
    userRewardsByStatusInPeriod: byStatus,
    userRewardsBySourceTypeInPeriod: bySourceType,
    userRewardsRedeemedInPeriod: redeemed,
    userRewardsClaimedInPeriod: claimed,
    userRewardsExpiredInPeriod: expired,
    topRewardsInPeriod,
    redemptionRate: claimed > 0 ? Math.round((redeemed / claimed) * 10000) / 10000 : 0,
  }
}
