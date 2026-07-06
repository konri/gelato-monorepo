import { PrismaClient, StampTransactionType } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'

export type StampsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  stampsEarnedTotalInPeriod: number
  stampEarnTransactionsInPeriod: number
  stampsUsedTotalInPeriod: number
  stampUsedTransactionsInPeriod: number
  stampsRefundedTotalInPeriod: number
  distinctCardsWithEarnedStampInPeriod: number
  averageEarnedStampsPerActiveCardInPeriod: number
  milestonesClaimedInPeriod: number
  milestonesRedeemedInPeriod: number
}

export async function computeStampsStats(prisma: PrismaClient, ctx: StatsContext): Promise<StampsStatsPayload> {
  const { merchantId, from, to, storeIds, loyaltyCardTemplateId: templateId } = ctx

  const baseTxWhere = {
    createdAt: { gte: from, lte: to },
    card: { merchantId, ...(templateId ? { templateId } : {}) },
    ...merchantStoreIdScopeWhere(storeIds),
  }

  const milestoneCardWhere = { merchantId, ...(templateId ? { templateId } : {}) }

  const [
    earnedAgg,
    usedAgg,
    refundedAgg,
    distinctEarnedBuckets,
    milestoneClaimed,
    milestoneRedeemed,
  ] = await Promise.all([
    prisma.stampTransaction.aggregate({
      where: { ...baseTxWhere, type: StampTransactionType.EARNED },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.stampTransaction.aggregate({
      where: { ...baseTxWhere, type: StampTransactionType.USED },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.stampTransaction.aggregate({
      where: { ...baseTxWhere, type: StampTransactionType.REFUNDED },
      _sum: { amount: true },
    }),
    prisma.stampTransaction.groupBy({
      by: ['cardId'],
      where: { ...baseTxWhere, type: StampTransactionType.EARNED },
      _count: { _all: true },
    }),
    prisma.claimedMilestone.count({
      where: {
        claimedAt: { gte: from, lte: to },
        card: milestoneCardWhere,
      },
    }),
    prisma.claimedMilestone.count({
      where: {
        isRedeemed: true,
        redeemedAt: { gte: from, lte: to },
        card: milestoneCardWhere,
      },
    }),
  ])

  const earnedTotal = earnedAgg._sum.amount ?? 0
  const distinctCards = distinctEarnedBuckets.length

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    stampsEarnedTotalInPeriod: earnedTotal,
    stampEarnTransactionsInPeriod: earnedAgg._count._all,
    stampsUsedTotalInPeriod: usedAgg._sum.amount ?? 0,
    stampUsedTransactionsInPeriod: usedAgg._count._all,
    stampsRefundedTotalInPeriod: refundedAgg._sum.amount ?? 0,
    distinctCardsWithEarnedStampInPeriod: distinctCards,
    averageEarnedStampsPerActiveCardInPeriod:
      distinctCards > 0 ? Math.round((earnedTotal / distinctCards) * 100) / 100 : 0,
    milestonesClaimedInPeriod: milestoneClaimed,
    milestonesRedeemedInPeriod: milestoneRedeemed,
  }
}
