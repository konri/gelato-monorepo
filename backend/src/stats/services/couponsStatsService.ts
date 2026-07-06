import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'

export type TopCouponRow = {
  couponId: string
  title: string
  couponType: string
  usageCount: number
}

export type CouponsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  totalCouponsConfigured: number
  activeCoupons: number
  userCouponsClaimedInPeriod: number
  userCouponsUsedInPeriod: number
  couponUsagesInPeriod: number
  distinctUsersWhoClaimed: number
  distinctUsersWhoUsed: number
  claimToUseRate: number
  byTypeInPeriod: Record<string, { claimed: number; used: number }>
  topCouponsByUsage: TopCouponRow[]
}

/**
 * Coupon program analytics: lifecycle counts, conversion, and top performers.
 */
export async function computeCouponsStats(prisma: PrismaClient, ctx: StatsContext): Promise<CouponsStatsPayload> {
  const { merchantId, from, to, storeIds } = ctx

  const [
    totalCoupons,
    activeCoupons,
    claimed,
    usedUC,
    usages,
    distinctClaimedUsers,
    distinctUsedUsers,
    couponMetaRows,
    claimedByCoupon,
    usedByCoupon,
    topUsageGroups,
  ] = await Promise.all([
    prisma.coupon.count({ where: { merchantId } }),
    prisma.coupon.count({ where: { merchantId, isActive: true } }),
    prisma.userCoupon.count({
      where: {
        coupon: { merchantId },
        createdAt: { gte: from, lte: to },
      },
    }),
    prisma.userCoupon.count({
      where: {
        coupon: { merchantId },
        isUsed: true,
        usedAt: { gte: from, lte: to },
      },
    }),
    prisma.couponUsage.count({
      where: {
        coupon: { merchantId },
        usedAt: { gte: from, lte: to },
        ...merchantStoreIdScopeWhere(storeIds),
      },
    }),
    prisma.userCoupon.findMany({
      where: {
        coupon: { merchantId },
        createdAt: { gte: from, lte: to },
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.couponUsage.findMany({
      where: {
        coupon: { merchantId },
        usedAt: { gte: from, lte: to },
        ...merchantStoreIdScopeWhere(storeIds),
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.coupon.findMany({
      where: { merchantId },
      select: { id: true, couponType: true },
    }),
    prisma.userCoupon.groupBy({
      by: ['couponId'],
      where: {
        coupon: { merchantId },
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    }),
    prisma.userCoupon.groupBy({
      by: ['couponId'],
      where: {
        coupon: { merchantId },
        isUsed: true,
        usedAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    }),
    prisma.couponUsage.groupBy({
      by: ['couponId'],
      where: {
        coupon: { merchantId },
        usedAt: { gte: from, lte: to },
        ...merchantStoreIdScopeWhere(storeIds),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const idToType = new Map(couponMetaRows.map((c) => [c.id, c.couponType]))
  const distinctTypes = [...new Set(couponMetaRows.map((c) => c.couponType))]
  const byType: Record<string, { claimed: number; used: number }> = {}
  for (const t of distinctTypes) {
    byType[t] = { claimed: 0, used: 0 }
  }
  for (const row of claimedByCoupon) {
    const t = idToType.get(row.couponId)
    if (t !== undefined) {
      byType[t].claimed += row._count._all
    }
  }
  for (const row of usedByCoupon) {
    const t = idToType.get(row.couponId)
    if (t !== undefined) {
      byType[t].used += row._count._all
    }
  }

  const topCouponIds = topUsageGroups.map((g) => g.couponId)
  const topCouponsMeta =
    topCouponIds.length > 0
      ? await prisma.coupon.findMany({
          where: { id: { in: topCouponIds } },
          select: { id: true, title: true, couponType: true },
        })
      : []
  const metaById = new Map(topCouponsMeta.map((c) => [c.id, c]))

  const topCouponsByUsage: TopCouponRow[] = topUsageGroups.map((g) => {
    const m = metaById.get(g.couponId)
    return {
      couponId: g.couponId,
      title: m?.title ?? '',
      couponType: m?.couponType ?? '',
      usageCount: g._count.id,
    }
  })

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    totalCouponsConfigured: totalCoupons,
    activeCoupons,
    userCouponsClaimedInPeriod: claimed,
    userCouponsUsedInPeriod: usedUC,
    couponUsagesInPeriod: usages,
    distinctUsersWhoClaimed: distinctClaimedUsers.length,
    distinctUsersWhoUsed: distinctUsedUsers.length,
    claimToUseRate: claimed > 0 ? Math.round((usages / claimed) * 10000) / 10000 : 0,
    byTypeInPeriod: byType,
    topCouponsByUsage,
  }
}
