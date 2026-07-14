import 'reflect-metadata'
import { Resolver, Query, Arg, Ctx, Authorized } from 'type-graphql'
import { UserActivity, ActivityType, ActivityStatus } from '../objectType/UserActivity'
import { UserActivityFilter } from '../inputType/UserActivityFilter'
import { Sort } from '../../shared/interface/Sort'
import { Context } from '../../shared/interface/Context'
import { Role } from '../objectType/Role'

@Resolver(() => UserActivity)
export class UserActivityResolver {
  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [UserActivity])
  async myActivities(
    @Arg('filter', { nullable: true }) filter?: UserActivityFilter,
    @Arg('sort', () => [Sort], { nullable: true }) sort?: Sort[],
    @Ctx() ctx?: Context
  ): Promise<UserActivity[]> {
    const userId = ctx!.req.user!.id
    const activities: UserActivity[] = []

    // 1. Stamp Cards
    if (!filter?.types || filter.types.includes(ActivityType.STAMP_CARD)) {
      const stampCards = await ctx!.prisma.loyaltyStampCard.findMany({
        where: {
          userId,
          ...(filter?.merchantId && { merchantId: filter.merchantId }),
        },
        include: {
          merchant: true,
          template: true,
        },
      })

      for (const card of stampCards) {
        let status: ActivityStatus
        if (card.stampsCollected >= card.stampsRequired) {
          status = ActivityStatus.COMPLETED
        } else if (card.stampsCollected > 0) {
          status = ActivityStatus.IN_PROGRESS
        } else {
          status = ActivityStatus.ACTIVE
        }

        if (!filter?.statuses || filter.statuses.includes(status)) {
          activities.push({
            id: card.id,
            type: ActivityType.STAMP_CARD,
            status,
            title: card.template?.title || `Karta pieczątek - ${card.merchant.name}`,
            description: card.template?.description,
            merchant: card.merchant,
            createdAt: card.createdAt,
            stampsCollected: card.stampsCollected,
            stampsRequired: card.stampsRequired,
          } as UserActivity)
        }
      }
    }

    // 2. Coupons
    if (!filter?.types || filter.types.includes(ActivityType.COUPON)) {
      const userCoupons = await ctx!.prisma.userCoupon.findMany({
        where: {
          userId,
          ...(filter?.merchantId && { coupon: { merchantId: filter.merchantId } }),
        },
        include: {
          coupon: {
            include: { merchant: true },
          },
        },
      })

      for (const userCoupon of userCoupons) {
        let status: ActivityStatus
        if (userCoupon.isUsed) {
          status = ActivityStatus.USED
        } else if (new Date() > userCoupon.coupon.validUntil) {
          status = ActivityStatus.EXPIRED
        } else {
          status = ActivityStatus.ACTIVE
        }

        if (!filter?.statuses || filter.statuses.includes(status)) {
          activities.push({
            id: userCoupon.coupon.id,
            type: ActivityType.COUPON,
            status,
            title: userCoupon.coupon.title,
            description: userCoupon.coupon.description,
            merchant: userCoupon.coupon.merchant,
            createdAt: userCoupon.createdAt,
            validUntil: userCoupon.coupon.validUntil,
            usedAt: userCoupon.usedAt,
            discountType: userCoupon.coupon.discountType,
            discountValue: userCoupon.coupon.discountValue,
          } as UserActivity)
        }
      }
    }

    // 3. Point Vouchers - skip for now as they don't have merchant relation
    // Point vouchers are global and not tied to specific merchants
    if (!filter?.types || filter.types.includes(ActivityType.POINT_VOUCHER)) {
      // Skip if filtering by merchantId since point vouchers are not merchant-specific
      if (!filter?.merchantId) {
        const pointVouchers = await ctx!.prisma.userPointVoucher.findMany({
          where: { userId },
          include: { pointVoucher: true },
        })

        for (const userVoucher of pointVouchers) {
          let status: ActivityStatus
          if (userVoucher.isUsed) {
            status = ActivityStatus.USED
          } else if (new Date() > userVoucher.validUntil) {
            status = ActivityStatus.EXPIRED
          } else {
            status = ActivityStatus.ACTIVE
          }

          if (!filter?.statuses || filter.statuses.includes(status)) {
            activities.push({
              id: userVoucher.id,
              type: ActivityType.POINT_VOUCHER,
              status,
              title: userVoucher.pointVoucher.title,
              description: userVoucher.pointVoucher.description,
              merchant: { id: 'global', name: 'EasyBons' } as any, // Global vouchers
              createdAt: userVoucher.createdAt,
              validUntil: userVoucher.validUntil,
              usedAt: userVoucher.usedAt,
              qrCode: userVoucher.qrCode,
              pointsCost: userVoucher.pointVoucher.pointsCost,
            } as UserActivity)
          }
        }
      }
    }

    // Apply search filter
    let filteredActivities = activities
    if (filter?.searchText) {
      const searchLower = filter.searchText.toLowerCase()
      filteredActivities = activities.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchLower) ||
          activity.description?.toLowerCase().includes(searchLower) ||
          activity.merchant.name.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    if (sort && sort.length > 0) {
      filteredActivities.sort((a, b) => {
        for (const sortItem of sort) {
          const aValue = (a as any)[sortItem.field]
          const bValue = (b as any)[sortItem.field]

          if (aValue < bValue) return sortItem.order === 'asc' ? -1 : 1
          if (aValue > bValue) return sortItem.order === 'asc' ? 1 : -1
        }
        return 0
      })
    } else {
      // Default sort by createdAt desc
      filteredActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return filteredActivities
  }
}
