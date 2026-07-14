import { PrismaClient, StampTransactionType } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'
import { countLoyaltyCardsCompleted, fetchLoyaltyStampCardsForStats } from '../utils/loyaltyStampCardMetrics'
import type { LoyaltyStampCardMetricRow } from '../utils/loyaltyStampCardMetrics'

export type ComputeFunnelsStatsOptions = {
  loyaltyCards?: LoyaltyStampCardMetricRow[]
}

export type FunnelsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  stampCardFunnel: {
    cardsTotal: number
    cardsWithAtLeastOneStamp: number
    cardsCompleted: number
    shareWithStamp: number
    shareCompleted: number
  }
  stampCardCohortFunnel: {
    cardsIssuedInPeriod: number
    cardsWithFirstStampInPeriod: number
    shareWithFirstStampInPeriod: number
  }
  couponFunnel: {
    activeCouponsForMerchant: number
    userCouponsClaimedInPeriod: number
    couponUsagesInPeriod: number
    claimToUseRate: number
  }
  // ⚠️ [WYMAGA ROZSZERZENIA] lejek kampanii (kupon → wizyta → pieczątka):
  //   Brak wspólnego `campaignId` lub `sessionId` łączącego claim kuponu z późniejszym
  //   nabiciem pieczątki w tej samej wizycie. Bez tego nie da się policzyć atrybucji.
  //   Rozwiązanie: dodać opcjonalny `campaignId` do CouponUsage i StampTransaction.
}

/**
 * High-level conversion metrics: stamp card lifecycle + coupon claim-to-use funnel.
 */
export async function computeFunnelsStats(
  prisma: PrismaClient,
  ctx: StatsContext,
  options?: ComputeFunnelsStatsOptions
): Promise<FunnelsStatsPayload> {
  const { merchantId, from, to, storeIds, loyaltyCardTemplateId: templateId } = ctx
  const tplWhere = templateId ? { templateId } : {}

  const [cards, cardsWithFirstStampInPeriod, activeCoupons, couponsClaimed, couponUsages] = await Promise.all([
    options?.loyaltyCards !== undefined
      ? Promise.resolve(options.loyaltyCards)
      : fetchLoyaltyStampCardsForStats(prisma, merchantId, templateId),
    prisma.loyaltyStampCard.count({
      where: {
        merchantId,
        ...tplWhere,
        createdAt: { gte: from, lte: to },
        transactions: {
          some: {
            type: StampTransactionType.EARNED,
            createdAt: { gte: from, lte: to },
          },
        },
      },
    }),
    prisma.coupon.count({
      where: { merchantId, isActive: true },
    }),
    prisma.userCoupon.count({
      where: {
        coupon: { merchantId },
        createdAt: { gte: from, lte: to },
      },
    }),
    prisma.couponUsage.count({
      where: {
        coupon: { merchantId },
        usedAt: { gte: from, lte: to },
        ...merchantStoreIdScopeWhere(storeIds),
      },
    }),
  ])

  const cardsTotal = cards.length
  const withStamp = cards.filter((c) => c.stampsCollected >= 1).length
  const completed = countLoyaltyCardsCompleted(cards)
  const cardsIssuedInPeriod = cards.filter((c) => c.createdAt >= from && c.createdAt <= to).length
  const cohortWithStamp = cardsWithFirstStampInPeriod

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    stampCardFunnel: {
      cardsTotal,
      cardsWithAtLeastOneStamp: withStamp,
      cardsCompleted: completed,
      shareWithStamp: cardsTotal > 0 ? Math.round((withStamp / cardsTotal) * 10000) / 10000 : 0,
      shareCompleted: cardsTotal > 0 ? Math.round((completed / cardsTotal) * 10000) / 10000 : 0,
    },
    stampCardCohortFunnel: {
      cardsIssuedInPeriod,
      cardsWithFirstStampInPeriod: cohortWithStamp,
      shareWithFirstStampInPeriod:
        cardsIssuedInPeriod > 0 ? Math.round((cohortWithStamp / cardsIssuedInPeriod) * 10000) / 10000 : 0,
    },
    couponFunnel: {
      activeCouponsForMerchant: activeCoupons,
      userCouponsClaimedInPeriod: couponsClaimed,
      couponUsagesInPeriod: couponUsages,
      claimToUseRate: couponsClaimed > 0 ? Math.round((couponUsages / couponsClaimed) * 10000) / 10000 : 0,
    },
  }
}
