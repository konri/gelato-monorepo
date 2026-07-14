import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'

export type UsersStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  distinctClientsWithStampCard: number
  distinctClientsActiveInPeriod: number
  newLoyaltyCardsIssuedInPeriod: number
  clientsWithFirstEverStampInPeriod: number
  distinctClientsWithPointBalance: number
  distinctClientsWithCouponUsageInPeriod: number
  distinctClientsWithStreakVisitInPeriod: number
  returningClientsActiveInPeriod: number
  newClientsFirstActivityInPeriod: number
  clientsActiveWithoutActivitySnapshot: number
}

async function countDistinctClientsWithCard(
  prisma: PrismaClient,
  merchantId: string,
  templateId: string | null
): Promise<number> {
  const rows = await prisma.loyaltyStampCard.groupBy({
    by: ['userId'],
    where: {
      merchantId,
      ...(templateId ? { templateId } : {}),
    },
    _count: { _all: true },
  })
  return rows.length
}

type UserActivityChannels = {
  activeIds: Set<string>
  distinctCouponUsers: number
  distinctStreakUsers: number
}

async function loadUserActivityChannels(
  prisma: PrismaClient,
  merchantId: string,
  from: Date,
  to: Date,
  storeIds: string[] | null,
  templateId: string | null,
  streakProgramId: string | null
): Promise<UserActivityChannels> {
  const storeWhere = merchantStoreIdScopeWhere(storeIds)
  const [stampUsers, pointUsers, couponUsers, streakUsers] = await Promise.all([
    prisma.stampTransaction.findMany({
      where: {
        type: 'EARNED',
        createdAt: { gte: from, lte: to },
        card: { merchantId, ...(templateId ? { templateId } : {}) },
        ...storeWhere,
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.merchantPointTransaction.findMany({
      where: {
        merchantId,
        createdAt: { gte: from, lte: to },
        ...storeWhere,
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.couponUsage.findMany({
      where: {
        usedAt: { gte: from, lte: to },
        coupon: { merchantId },
        ...storeWhere,
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.streakVisit.findMany({
      where: {
        merchantId,
        createdAt: { gte: from, lte: to },
        ...(streakProgramId ? { streakProgramId } : {}),
        ...storeWhere,
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ])
  const activeIds = new Set<string>()
  for (const r of stampUsers) activeIds.add(r.userId)
  for (const r of pointUsers) activeIds.add(r.userId)
  for (const r of couponUsers) activeIds.add(r.userId)
  for (const r of streakUsers) activeIds.add(r.userId)
  return {
    activeIds,
    distinctCouponUsers: couponUsers.length,
    distinctStreakUsers: streakUsers.length,
  }
}

async function countClientsWithFirstStampInPeriod(
  prisma: PrismaClient,
  merchantId: string,
  from: Date,
  to: Date,
  storeIds: string[] | null,
  templateId: string | null
): Promise<number> {
  const groups = await prisma.stampTransaction.groupBy({
    by: ['userId'],
    where: {
      type: 'EARNED',
      card: { merchantId, ...(templateId ? { templateId } : {}) },
      ...merchantStoreIdScopeWhere(storeIds),
    },
    _min: { createdAt: true },
  })
  return groups.filter((g) => g._min.createdAt !== null && g._min.createdAt >= from && g._min.createdAt <= to).length
}

async function activitySplitForActiveUsers(
  prisma: PrismaClient,
  merchantId: string,
  from: Date,
  to: Date,
  activeUserIds: Set<string>
): Promise<{ returning: number; newFirst: number; missing: number }> {
  if (activeUserIds.size === 0) {
    return { returning: 0, newFirst: 0, missing: 0 }
  }
  const ids = [...activeUserIds]
  const snapshots = await prisma.userMerchantActivitySnapshot.findMany({
    where: { merchantId, userId: { in: ids } },
    select: { userId: true, firstActiveAt: true },
  })
  const snapByUser = new Map(snapshots.map((s) => [s.userId, s.firstActiveAt]))
  let returning = 0
  let newFirst = 0
  let missing = 0
  for (const uid of activeUserIds) {
    const firstAt = snapByUser.get(uid)
    if (!firstAt) {
      missing++
      continue
    }
    if (firstAt < from) {
      returning++
    } else if (firstAt >= from && firstAt <= to) {
      newFirst++
    }
  }
  return { returning, newFirst, missing }
}

export async function computeUsersStats(prisma: PrismaClient, ctx: StatsContext): Promise<UsersStatsPayload> {
  const { merchantId, from, to, storeIds, loyaltyCardTemplateId, streakProgramId } = ctx
  const templateId = loyaltyCardTemplateId

  const [
    distinctClientsWithStampCard,
    channels,
    newLoyaltyCardsIssuedInPeriod,
    clientsWithFirstEverStampInPeriod,
    distinctClientsWithPointBalance,
  ] = await Promise.all([
    countDistinctClientsWithCard(prisma, merchantId, templateId),
    loadUserActivityChannels(prisma, merchantId, from, to, storeIds, templateId, streakProgramId),
    prisma.loyaltyStampCard.count({
      where: {
        merchantId,
        createdAt: { gte: from, lte: to },
        ...(templateId ? { templateId } : {}),
      },
    }),
    countClientsWithFirstStampInPeriod(prisma, merchantId, from, to, storeIds, templateId),
    prisma.userMerchantPointBalance.count({ where: { merchantId } }),
  ])

  const activitySplit = await activitySplitForActiveUsers(prisma, merchantId, from, to, channels.activeIds)

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    distinctClientsWithStampCard,
    distinctClientsActiveInPeriod: channels.activeIds.size,
    newLoyaltyCardsIssuedInPeriod,
    clientsWithFirstEverStampInPeriod,
    distinctClientsWithPointBalance,
    distinctClientsWithCouponUsageInPeriod: channels.distinctCouponUsers,
    distinctClientsWithStreakVisitInPeriod: channels.distinctStreakUsers,
    returningClientsActiveInPeriod: activitySplit.returning,
    newClientsFirstActivityInPeriod: activitySplit.newFirst,
    clientsActiveWithoutActivitySnapshot: activitySplit.missing,
  }
}
