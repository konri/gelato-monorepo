import { PrismaClient } from '@prisma/client'

export type LoyaltyStampCardMetricRow = {
  stampsCollected: number
  stampsRequired: number
  usedAt: Date | null
  isActive: boolean
  updatedAt: Date
  createdAt: Date
}

export async function fetchLoyaltyStampCardsForStats(
  prisma: PrismaClient,
  merchantId: string,
  templateId: string | null
): Promise<LoyaltyStampCardMetricRow[]> {
  return prisma.loyaltyStampCard.findMany({
    where: { merchantId, ...(templateId ? { templateId } : {}) },
    select: {
      stampsCollected: true,
      stampsRequired: true,
      usedAt: true,
      isActive: true,
      updatedAt: true,
      createdAt: true,
    },
  })
}

export function countLoyaltyCardsCompleted(cards: LoyaltyStampCardMetricRow[]): number {
  return cards.filter((c) => c.usedAt !== null || c.stampsCollected >= c.stampsRequired).length
}

export function countLoyaltyCardsAbandonedPartial(cards: LoyaltyStampCardMetricRow[]): number {
  return cards.filter(
    (c) => !c.isActive && c.usedAt === null && c.stampsCollected > 0 && c.stampsCollected < c.stampsRequired
  ).length
}

export function countLoyaltyCardsCompletedInPeriod(cards: LoyaltyStampCardMetricRow[], from: Date, to: Date): number {
  return cards.filter((c) => {
    if (c.usedAt !== null && c.usedAt >= from && c.usedAt <= to) {
      return true
    }
    if (c.usedAt === null && c.stampsCollected >= c.stampsRequired && c.updatedAt >= from && c.updatedAt <= to) {
      return true
    }
    return false
  }).length
}
