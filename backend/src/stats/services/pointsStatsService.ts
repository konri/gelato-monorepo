import { PrismaClient, TransactionType } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'

export type PointsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  merchantPointsEarnedInPeriod: number
  merchantPointsSpentInPeriod: number
  merchantPointsRefundedInPeriod: number
  merchantPointsBonusInPeriod: number
  merchantPointsPenaltyInPeriod: number
  merchantPointLedgerRowsInPeriod: number
  distinctUsersWithMerchantPointLedgerInPeriod: number
  averageAvailablePointsPerBalance: number
  totalAvailablePointsLiability: number
  usersWithMerchantPointBalance: number
}

async function aggregateMerchantPoints(
  prisma: PrismaClient,
  merchantId: string,
  from: Date,
  to: Date,
  storeIds: string[] | null
) {
  const baseWhere = {
    merchantId,
    createdAt: { gte: from, lte: to },
    ...merchantStoreIdScopeWhere(storeIds),
  }

  const [earned, spent, refunded, bonus, penalty, txCount, distinctUsers] = await Promise.all([
    prisma.merchantPointTransaction.aggregate({
      where: { ...baseWhere, type: TransactionType.EARNED },
      _sum: { amount: true },
    }),
    prisma.merchantPointTransaction.aggregate({
      where: { ...baseWhere, type: TransactionType.SPENT },
      _sum: { amount: true },
    }),
    prisma.merchantPointTransaction.aggregate({
      where: { ...baseWhere, type: TransactionType.REFUND },
      _sum: { amount: true },
    }),
    prisma.merchantPointTransaction.aggregate({
      where: { ...baseWhere, type: TransactionType.BONUS },
      _sum: { amount: true },
    }),
    prisma.merchantPointTransaction.aggregate({
      where: { ...baseWhere, type: TransactionType.PENALTY },
      _sum: { amount: true },
    }),
    prisma.merchantPointTransaction.count({ where: baseWhere }),
    prisma.merchantPointTransaction.groupBy({
      by: ['userId'],
      where: baseWhere,
      _count: { _all: true },
    }),
  ])

  return {
    earned: BigInt(earned._sum.amount ?? 0),
    spent: BigInt(spent._sum.amount ?? 0),
    refunded: BigInt(refunded._sum.amount ?? 0),
    bonus: BigInt(bonus._sum.amount ?? 0),
    penalty: BigInt(penalty._sum.amount ?? 0),
    tx_count: BigInt(txCount),
    distinct_users: BigInt(distinctUsers.length),
  }
}

export async function computePointsStats(prisma: PrismaClient, ctx: StatsContext): Promise<PointsStatsPayload> {
  const { merchantId, from, to, storeIds } = ctx

  const [agg, balanceAgg, usersWithBalance] = await Promise.all([
    aggregateMerchantPoints(prisma, merchantId, from, to, storeIds),
    prisma.userMerchantPointBalance.aggregate({
      where: { merchantId },
      _avg: { availablePoints: true },
      _sum: { availablePoints: true },
    }),
    prisma.userMerchantPointBalance.count({ where: { merchantId } }),
  ])

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    merchantPointsEarnedInPeriod: Number(agg.earned),
    merchantPointsSpentInPeriod: Number(agg.spent),
    merchantPointsRefundedInPeriod: Number(agg.refunded),
    merchantPointsBonusInPeriod: Number(agg.bonus),
    merchantPointsPenaltyInPeriod: Number(agg.penalty),
    merchantPointLedgerRowsInPeriod: Number(agg.tx_count),
    distinctUsersWithMerchantPointLedgerInPeriod: Number(agg.distinct_users),
    averageAvailablePointsPerBalance: Math.round((balanceAgg._avg.availablePoints ?? 0) * 100) / 100,
    totalAvailablePointsLiability: balanceAgg._sum.availablePoints ?? 0,
    usersWithMerchantPointBalance: usersWithBalance,
  }
}
