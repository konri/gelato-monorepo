import { PrismaClient } from '@prisma/client'

export interface StampDiscrepancy {
  cardId: string
  userId: string
  merchantId: string
  cardBalance: number
  transactionSum: number
  physicalStamps: number
  issueType: string
}

export class StampIntegrityService {
  constructor(private prisma: PrismaClient) {}

  async validateStampCard(cardId: string): Promise<boolean> {
    const card = await this.prisma.loyaltyStampCard.findUnique({
      where: { id: cardId },
      include: {
        stamps: true,
        transactions: true,
      },
    })

    if (!card) return false

    const transactionSum = card.transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const physicalStamps = card.stamps.filter((s) => !s.isUsed).length

    return card.stampsCollected === transactionSum && card.stampsCollected === physicalStamps
  }

  async findDiscrepancies(): Promise<StampDiscrepancy[]> {
    const cards = await this.prisma.loyaltyStampCard.findMany({
      include: {
        stamps: true,
        transactions: true,
      },
    })

    const discrepancies: StampDiscrepancy[] = []

    for (const card of cards) {
      const transactionSum = card.transactions.reduce((sum, tx) => sum + tx.amount, 0)
      const physicalStamps = card.stamps.filter((s) => !s.isUsed).length

      if (card.stampsCollected !== transactionSum || card.stampsCollected !== physicalStamps) {
        discrepancies.push({
          cardId: card.id,
          userId: card.userId,
          merchantId: card.merchantId,
          cardBalance: card.stampsCollected,
          transactionSum,
          physicalStamps,
          issueType: card.stampsCollected !== transactionSum ? 'TRANSACTION_MISMATCH' : 'PHYSICAL_MISMATCH',
        })
      }
    }

    return discrepancies
  }

  async fixCardDiscrepancy(cardId: string): Promise<boolean> {
    const card = await this.prisma.loyaltyStampCard.findUnique({
      where: { id: cardId },
      include: { transactions: true },
    })

    if (!card) return false

    const correctBalance = card.transactions.reduce((sum, tx) => sum + tx.amount, 0)

    await this.prisma.loyaltyStampCard.update({
      where: { id: cardId },
      data: { stampsCollected: correctBalance },
    })

    return true
  }

  async getIntegrityReport() {
    const discrepancies = await this.findDiscrepancies()
    const totalCards = await this.prisma.loyaltyStampCard.count()
    const invalidCards = discrepancies.length
    const validCards = totalCards - invalidCards
    const integrityPercentage = totalCards > 0 ? (validCards / totalCards) * 100 : 100

    return {
      totalCards,
      validCards,
      invalidCards,
      integrityPercentage: Math.round(integrityPercentage * 100) / 100,
      discrepancies,
    }
  }
}
