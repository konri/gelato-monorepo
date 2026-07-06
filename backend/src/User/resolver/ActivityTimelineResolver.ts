import 'reflect-metadata'
import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { ActivityTimeline, TimelineActivityType, TransactionDirection } from '../objectType/ActivityTimeline'
import { Context } from '../../shared/interface/Context'
import { Role } from '../objectType/Role'

@Resolver(() => ActivityTimeline)
export class ActivityTimelineResolver {
  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [ActivityTimeline])
  async myActivityTimeline(@Ctx() ctx?: Context): Promise<ActivityTimeline[]> {
    const userId = ctx!.req.user!.id
    const activities: ActivityTimeline[] = []

    // 1. Stamp Transactions - historia pieczątek
    const stampTransactions = await ctx!.prisma.stampTransaction.findMany({
      where: { userId },
      include: {
        card: {
          include: {
            merchant: true,
            template: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    for (const tx of stampTransactions) {
      let type: TimelineActivityType
      let direction: TransactionDirection

      if (tx.type === 'EARNED') {
        type = TimelineActivityType.STAMP_ADDED
        direction = TransactionDirection.INCOMING
      } else if (tx.type === 'USED') {
        type = TimelineActivityType.STAMP_CARD_COMPLETED
        direction = TransactionDirection.OUTGOING
      } else {
        continue
      }

      activities.push({
        id: `stamp-tx-${tx.id}`,
        type,
        direction,
        title: tx.description,
        description: tx.card.template?.description || undefined,
        createdAt: tx.createdAt,
        timeAgoMinutes: this.getMinutesAgo(tx.createdAt),
        iconUrl: tx.card.template?.stampStickerIconUrl || undefined,
        merchantName: tx.card.merchant.name,
        stampsAmount: tx.amount,
        merchant: tx.card.merchant as any,
      })
    }

    // 2. Point Transactions - historia punktów
    const pointTransactions = await ctx!.prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    for (const tx of pointTransactions) {
      const isIncoming = ['EARNED', 'BONUS', 'REFUND'].includes(tx.type)
      activities.push({
        id: `point-tx-${tx.id}`,
        type: isIncoming ? TimelineActivityType.POINTS_EARNED : TimelineActivityType.POINTS_SPENT,
        direction: isIncoming ? TransactionDirection.INCOMING : TransactionDirection.OUTGOING,
        title: tx.description,
        createdAt: tx.createdAt,
        timeAgoMinutes: this.getMinutesAgo(tx.createdAt),
        iconUrl: '/assets/points-icon.png',
        merchantName: 'Bonapka',
        pointsAmount: tx.amount,
      })
    }

    // 3. Voucher History - historia voucherów
    const voucherHistory = await ctx!.prisma.voucherHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    for (const vh of voucherHistory) {
      let type: TimelineActivityType
      let direction: TransactionDirection

      if (vh.action === 'PURCHASED') {
        if (vh.voucherType === 'POINT_VOUCHER') {
          type = TimelineActivityType.VOUCHER_PURCHASED
          direction = TransactionDirection.OUTGOING
        } else {
          type = TimelineActivityType.COUPON_CLAIMED
          direction = TransactionDirection.INCOMING
        }
      } else if (vh.action === 'USED') {
        if (vh.voucherType === 'POINT_VOUCHER') {
          type = TimelineActivityType.VOUCHER_USED
          direction = TransactionDirection.OUTGOING
        } else {
          type = TimelineActivityType.COUPON_USED
          direction = TransactionDirection.OUTGOING
        }
      } else {
        continue
      }

      activities.push({
        id: `voucher-history-${vh.id}`,
        type,
        direction,
        title: vh.voucherTitle,
        createdAt: vh.createdAt,
        timeAgoMinutes: this.getMinutesAgo(vh.createdAt),
        iconUrl: vh.voucherType === 'POINT_VOUCHER' ? '/assets/voucher-icon.png' : undefined,
        merchantName: vh.voucherType === 'POINT_VOUCHER' ? 'Bonapka' : undefined,
        pointsAmount: vh.pointsSpent || undefined,
      })
    }

    // Sort by date descending
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  private getMinutesAgo(date: Date): number {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    return Math.floor(diffMs / 60000)
  }
}
