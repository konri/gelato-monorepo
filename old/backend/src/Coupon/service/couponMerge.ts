import { AvailabilityType, Coupon as PrismaCoupon, VoucherDisplayType } from '@prisma/client'
import { CouponStoreOverrideLike, CouponStoreOverrideMapper } from '../mappers/CouponStoreOverrideMapper'

export type { CouponStoreOverrideLike }

export function mergePrismaCouponWithOverride(
  coupon: PrismaCoupon,
  override: CouponStoreOverrideLike | null
): PrismaCoupon {
  if (!override) {
    return coupon
  }
  const availability: AvailabilityType = override.availability ?? coupon.availability
  const displayType: VoucherDisplayType = override.displayType ?? coupon.displayType
  const pointsCost =
    availability === AvailabilityType.FREE
      ? null
      : override.pointsCost != null
      ? override.pointsCost
      : coupon.pointsCost ?? null
  return CouponStoreOverrideMapper.toMergedPrisma(coupon, override, {
    availability,
    displayType,
    pointsCost,
  })
}
