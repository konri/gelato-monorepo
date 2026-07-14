import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import {
  countLoyaltyCardsAbandonedPartial,
  countLoyaltyCardsCompleted,
  countLoyaltyCardsCompletedInPeriod,
  fetchLoyaltyStampCardsForStats,
} from '../utils/loyaltyStampCardMetrics'
import type { LoyaltyStampCardMetricRow } from '../utils/loyaltyStampCardMetrics'

export type ComputeCardsStatsOptions = {
  loyaltyCards?: LoyaltyStampCardMetricRow[]
}

export type CardsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  loyaltyCardsTotal: number
  loyaltyCardsActive: number
  loyaltyCardsCompleted: number
  loyaltyCardsAbandonedPartial: number
  loyaltyCardsIssuedInPeriod: number
  loyaltyCardsCompletedInPeriod: number
  averageStampsCollectedOnActiveCards: number
}

async function averageStampsOnActiveCards(
  prisma: PrismaClient,
  merchantId: string,
  templateId: string | null
): Promise<number> {
  const agg = await prisma.loyaltyStampCard.aggregate({
    where: { merchantId, isActive: true, ...(templateId ? { templateId } : {}) },
    _avg: { stampsCollected: true },
  })
  return Math.round((agg._avg.stampsCollected ?? 0) * 100) / 100
}

export async function computeCardsStats(
  prisma: PrismaClient,
  ctx: StatsContext,
  options?: ComputeCardsStatsOptions
): Promise<CardsStatsPayload> {
  const { merchantId, from, to, storeIds, loyaltyCardTemplateId: templateId } = ctx

  const [cards, averageStampsCollectedOnActiveCards] = await Promise.all([
    options?.loyaltyCards !== undefined
      ? Promise.resolve(options.loyaltyCards)
      : fetchLoyaltyStampCardsForStats(prisma, merchantId, templateId),
    averageStampsOnActiveCards(prisma, merchantId, templateId),
  ])

  const loyaltyCardsTotal = cards.length
  const loyaltyCardsActive = cards.filter((c) => c.isActive).length
  const loyaltyCardsIssuedInPeriod = cards.filter((c) => c.createdAt >= from && c.createdAt <= to).length

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    loyaltyCardsTotal,
    loyaltyCardsActive,
    loyaltyCardsCompleted: countLoyaltyCardsCompleted(cards),
    loyaltyCardsAbandonedPartial: countLoyaltyCardsAbandonedPartial(cards),
    loyaltyCardsIssuedInPeriod,
    loyaltyCardsCompletedInPeriod: countLoyaltyCardsCompletedInPeriod(cards, from, to),
    averageStampsCollectedOnActiveCards,
  }
}
