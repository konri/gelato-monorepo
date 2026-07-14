import { CouponType } from '@prisma/client'
import type { Coupon as PrismaCoupon } from '@prisma/client'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

type CouponTypeShapeInput = {
  couponType: CouponType
  buyQuantity?: number | null
  getQuantity?: number | null
  dayOfWeek?: string | null
  thresholdAmount?: number | null
  discountAmount?: number | null
  itemName?: string | null
  activityType?: string | null
  discountType?: string | null
  discountValue?: number | null
}

export function assertCouponTypeSpecificShape(data: CouponTypeShapeInput): void {
  switch (data.couponType) {
    case CouponType.MULTI_BUY:
      if (data.buyQuantity == null || data.getQuantity == null || data.buyQuantity < 1 || data.getQuantity < 1) {
        throw new ErrorWithStatus(400, 'COUPON_MULTI_BUY_REQUIRES_POSITIVE_QUANTITIES')
      }
      return
    case CouponType.DAY_OF_WEEK: {
      const day = data.dayOfWeek?.trim()
      if (!day) {
        throw new ErrorWithStatus(400, 'COUPON_DAY_OF_WEEK_REQUIRES_DAY')
      }
      if (data.discountType == null || data.discountValue == null || data.discountValue < 0) {
        throw new ErrorWithStatus(400, 'COUPON_DAY_OF_WEEK_REQUIRES_DISCOUNT')
      }
      return
    }
    case CouponType.THRESHOLD_DISCOUNT:
      if (
        data.thresholdAmount == null ||
        data.discountAmount == null ||
        data.thresholdAmount <= 0 ||
        data.discountAmount <= 0
      ) {
        throw new ErrorWithStatus(400, 'COUPON_THRESHOLD_REQUIRES_POSITIVE_AMOUNTS')
      }
      return
    case CouponType.ITEM_SPECIFIC: {
      const name = data.itemName?.trim()
      if (!name) {
        throw new ErrorWithStatus(400, 'COUPON_ITEM_SPECIFIC_REQUIRES_NAME')
      }
      if (data.discountType == null || data.discountValue == null || data.discountValue < 0) {
        throw new ErrorWithStatus(400, 'COUPON_ITEM_SPECIFIC_REQUIRES_DISCOUNT')
      }
      return
    }
    case CouponType.ACTIVITY: {
      const activity = data.activityType?.trim()
      if (!activity) {
        throw new ErrorWithStatus(400, 'COUPON_ACTIVITY_REQUIRES_TYPE')
      }
      if (data.discountType == null || data.discountValue == null || data.discountValue < 0) {
        throw new ErrorWithStatus(400, 'COUPON_ACTIVITY_REQUIRES_DISCOUNT')
      }
      return
    }
    case CouponType.BIRTHDAY:
      if (data.discountType == null || data.discountValue == null || data.discountValue < 0) {
        throw new ErrorWithStatus(400, 'COUPON_BIRTHDAY_REQUIRES_DISCOUNT')
      }
      return
    case CouponType.DISCOUNT:
      if (data.discountType == null || data.discountValue == null || data.discountValue < 0) {
        throw new ErrorWithStatus(400, 'COUPON_DISCOUNT_REQUIRES_VALUE')
      }
      return
    default:
      return
  }
}

export function assertCouponTypeSpecificShapeFromPrismaCoupon(effective: PrismaCoupon): void {
  assertCouponTypeSpecificShape({
    couponType: effective.couponType,
    buyQuantity: effective.buyQuantity,
    getQuantity: effective.getQuantity,
    dayOfWeek: effective.dayOfWeek,
    thresholdAmount: effective.thresholdAmount,
    discountAmount: effective.discountAmount,
    itemName: effective.itemName,
    activityType: effective.activityType,
    discountType: effective.discountType,
    discountValue: effective.discountValue,
  })
}
