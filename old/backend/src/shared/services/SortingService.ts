import { SearchSortOrder } from '../enums/SortOrder'

export interface SortableItem {
  distanceKm?: number
  name?: string
  title?: string
  priority?: number
  createdAt?: Date
  pointsCost?: number | null
  validUntil?: Date | null
  usageCount?: number
  stampsRequired?: number
  store?: { name?: string; id?: string }
  merchant?: { name?: string }
  coupon?: { title?: string; pointsCost?: number | null; validUntil?: Date | null; priority?: number; createdAt?: Date }
}

export class SortingService {
  static sortItems<T extends SortableItem>(
    items: T[],
    sortBy: SearchSortOrder = SearchSortOrder.DISTANCE,
    reverse: boolean = false
  ): T[] {
    let sorted = [...items]

    switch (sortBy) {
      case SearchSortOrder.DISTANCE:
        sorted.sort((a, b) => {
          const distA = a.distanceKm ?? Infinity
          const distB = b.distanceKm ?? Infinity
          return distA - distB
        })
        break

      case SearchSortOrder.ALPHABETICAL:
        sorted.sort((a, b) => {
          const nameA = (a.store?.name || a.merchant?.name || a.coupon?.title || a.name || a.title || '').toLowerCase()
          const nameB = (b.store?.name || b.merchant?.name || b.coupon?.title || b.name || b.title || '').toLowerCase()
          return nameA.localeCompare(nameB, 'pl')
        })
        break

      case SearchSortOrder.ALPHABETICAL_DESC:
        sorted.sort((a, b) => {
          const nameA = (a.store?.name || a.merchant?.name || a.coupon?.title || a.name || a.title || '').toLowerCase()
          const nameB = (b.store?.name || b.merchant?.name || b.coupon?.title || b.name || b.title || '').toLowerCase()
          return nameB.localeCompare(nameA, 'pl')
        })
        break

      case SearchSortOrder.PRIORITY:
        sorted.sort((a, b) => {
          const priorityA = (a.coupon?.priority || a.priority) ?? 0
          const priorityB = (b.coupon?.priority || b.priority) ?? 0
          if (priorityB !== priorityA) {
            return priorityB - priorityA
          }
          const distA = a.distanceKm ?? Infinity
          const distB = b.distanceKm ?? Infinity
          return distA - distB
        })
        break

      case SearchSortOrder.NEWEST:
        sorted.sort((a, b) => {
          const dateA = a.coupon?.createdAt || a.createdAt ? new Date(a.coupon?.createdAt || a.createdAt!).getTime() : 0
          const dateB = b.coupon?.createdAt || b.createdAt ? new Date(b.coupon?.createdAt || b.createdAt!).getTime() : 0
          return dateB - dateA
        })
        break

      case SearchSortOrder.OLDEST:
        sorted.sort((a, b) => {
          const dateA = a.coupon?.createdAt || a.createdAt ? new Date(a.coupon?.createdAt || a.createdAt!).getTime() : 0
          const dateB = b.coupon?.createdAt || b.createdAt ? new Date(b.coupon?.createdAt || b.createdAt!).getTime() : 0
          return dateA - dateB
        })
        break

      case SearchSortOrder.POINTS_ASC:
        sorted.sort((a, b) => {
          const pointsA = a.coupon?.pointsCost ?? a.pointsCost ?? 0
          const pointsB = b.coupon?.pointsCost ?? b.pointsCost ?? 0
          return pointsA - pointsB
        })
        break

      case SearchSortOrder.POINTS_DESC:
        sorted.sort((a, b) => {
          const pointsA = a.coupon?.pointsCost ?? a.pointsCost ?? 0
          const pointsB = b.coupon?.pointsCost ?? b.pointsCost ?? 0
          return pointsB - pointsA
        })
        break

      case SearchSortOrder.POPULARITY:
        sorted.sort((a, b) => {
          const usageA = a.usageCount ?? 0
          const usageB = b.usageCount ?? 0
          if (usageB !== usageA) {
            return usageB - usageA
          }
          const distA = a.distanceKm ?? Infinity
          const distB = b.distanceKm ?? Infinity
          return distA - distB
        })
        break

      case SearchSortOrder.EXPIRING_SOON:
        sorted.sort((a, b) => {
          const dateA =
            a.coupon?.validUntil || a.validUntil ? new Date(a.coupon?.validUntil || a.validUntil!).getTime() : Infinity
          const dateB =
            b.coupon?.validUntil || b.validUntil ? new Date(b.coupon?.validUntil || b.validUntil!).getTime() : Infinity
          return dateA - dateB
        })
        break

      default:
        sorted.sort((a, b) => {
          const distA = a.distanceKm ?? Infinity
          const distB = b.distanceKm ?? Infinity
          return distA - distB
        })
    }

    return reverse ? sorted.reverse() : sorted
  }

  static async getCouponUsageCount(couponId: string, prisma: any): Promise<number> {
    const count = await prisma.couponUsage.count({
      where: { couponId },
    })
    return count
  }

  static async getStampCardUsageCount(templateId: string, prisma: any): Promise<number> {
    const count = await prisma.loyaltyStampCard.count({
      where: { templateId, isActive: true },
    })
    return count
  }
}
