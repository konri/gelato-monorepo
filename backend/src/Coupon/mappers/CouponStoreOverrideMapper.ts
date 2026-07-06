import {
  AvailabilityType,
  Coupon as PrismaCoupon,
  CouponStoreOverride,
  CouponType,
  DiscountType,
  VoucherDisplayType,
} from '@prisma/client'

const mergeCouponType = (overrideType: CouponStoreOverride['couponType'] | undefined, base: CouponType): CouponType =>
  overrideType ?? base

const mergeDiscountType = (
  overrideType: CouponStoreOverride['discountType'] | undefined,
  base: DiscountType | null
): DiscountType | null => overrideType ?? base

const mergeOverrideExclusivityGroups = (raw: unknown, fallback: string[]): string[] => {
  if (raw == null) {
    return fallback
  }
  if (Array.isArray(raw) && raw.every((v): v is string => typeof v === 'string')) {
    return raw
  }
  return fallback
}

export type CouponStoreOverrideLike = Partial<
  Pick<
    CouponStoreOverride,
    | 'title'
    | 'description'
    | 'shortDescription'
    | 'termsAndConditions'
    | 'imageUrl'
    | 'couponType'
    | 'availability'
    | 'displayType'
    | 'pointsCost'
    | 'priority'
    | 'rewardId'
    | 'validFrom'
    | 'validUntil'
    | 'assignToUserId'
    | 'exclusivityGroups'
    | 'buyQuantity'
    | 'getQuantity'
    | 'discountType'
    | 'discountValue'
    | 'dayOfWeek'
    | 'thresholdAmount'
    | 'discountAmount'
    | 'itemName'
    | 'itemBarcode'
    | 'daysBeforeBirthday'
    | 'daysAfterBirthday'
    | 'activityType'
    | 'isActive'
    | 'usesPerUserLimit'
    | 'globalUsageLimit'
    | 'isStackable'
  >
>

type MergedCouponResolvedFields = {
  availability: AvailabilityType
  displayType: VoucherDisplayType
  pointsCost: number | null
}

export class CouponStoreOverrideMapper {
  static toMergedPrisma(
    coupon: PrismaCoupon,
    override: CouponStoreOverrideLike,
    resolved: MergedCouponResolvedFields
  ): PrismaCoupon {
    const { availability, displayType, pointsCost } = resolved
    return {
      ...coupon,
      title: override.title ?? coupon.title,
      description: override.description ?? coupon.description,
      shortDescription: override.shortDescription ?? coupon.shortDescription,
      termsAndConditions: override.termsAndConditions ?? coupon.termsAndConditions,
      imageUrl: override.imageUrl ?? coupon.imageUrl,
      couponType: mergeCouponType(override.couponType, coupon.couponType),
      availability,
      displayType,
      pointsCost,
      priority: override.priority ?? coupon.priority,
      rewardId: override.rewardId ?? coupon.rewardId,
      validFrom: override.validFrom ?? coupon.validFrom,
      validUntil: override.validUntil ?? coupon.validUntil,
      assignToUserId: override.assignToUserId ?? coupon.assignToUserId,
      exclusivityGroups: mergeOverrideExclusivityGroups(override.exclusivityGroups, coupon.exclusivityGroups ?? []),
      buyQuantity: override.buyQuantity != null ? override.buyQuantity : coupon.buyQuantity,
      getQuantity: override.getQuantity != null ? override.getQuantity : coupon.getQuantity,
      discountType: mergeDiscountType(override.discountType, coupon.discountType),
      discountValue: override.discountValue != null ? override.discountValue : coupon.discountValue,
      dayOfWeek: override.dayOfWeek ?? coupon.dayOfWeek,
      thresholdAmount: override.thresholdAmount != null ? override.thresholdAmount : coupon.thresholdAmount,
      discountAmount: override.discountAmount != null ? override.discountAmount : coupon.discountAmount,
      itemName: override.itemName ?? coupon.itemName,
      itemBarcode: override.itemBarcode ?? coupon.itemBarcode,
      daysBeforeBirthday: override.daysBeforeBirthday != null ? override.daysBeforeBirthday : coupon.daysBeforeBirthday,
      daysAfterBirthday: override.daysAfterBirthday != null ? override.daysAfterBirthday : coupon.daysAfterBirthday,
      activityType: override.activityType ?? coupon.activityType,
      isActive: override.isActive ?? coupon.isActive,
      usesPerUserLimit: override.usesPerUserLimit != null ? override.usesPerUserLimit : coupon.usesPerUserLimit,
      globalUsageLimit: override.globalUsageLimit != null ? override.globalUsageLimit : coupon.globalUsageLimit,
      isStackable: override.isStackable ?? coupon.isStackable,
    }
  }
}
