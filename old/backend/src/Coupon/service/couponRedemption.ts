import type { Coupon as PrismaCoupon, CouponStoreOverride, Prisma, UserCoupon } from '@prisma/client'
import { mergePrismaCouponWithOverride } from './couponMerge'
import { assertCouponUseAllowed } from './couponRules'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'

export async function applyCouponRedemptionInTransaction(
  tx: Prisma.TransactionClient,
  params: {
    userCoupon: UserCoupon & { coupon: PrismaCoupon }
    storeId: string
    override: CouponStoreOverride | null
    birthDate: Date | null
    redeemedAt: Date
  }
): Promise<void> {
  const { userCoupon, storeId, override, birthDate, redeemedAt } = params
  const base = userCoupon.coupon
  const effective = mergePrismaCouponWithOverride(base, override)

  const userUsageCount = await tx.couponUsage.count({
    where: {
      couponId: base.id,
      userId: userCoupon.userId,
    },
  })

  assertCouponUseAllowed({
    actingUserId: userCoupon.userId,
    birthDate,
    now: redeemedAt,
    userCouponIsUsed: userCoupon.isUsed,
    userUsageCount,
    baseCurrentUses: base.currentUses,
    effective,
  })

  const perUserCap = effective.usesPerUserLimit ?? 1
  const exhausted = userUsageCount + 1 >= perUserCap
  const remainingUses =
    effective.usesPerUserLimit != null ? Math.max(0, effective.usesPerUserLimit - userUsageCount - 1) : null

  await tx.userCoupon.update({
    where: {
      userId_couponId: {
        userId: userCoupon.userId,
        couponId: userCoupon.couponId,
      },
    },
    data: {
      isUsed: exhausted,
      usedAt: redeemedAt,
    },
  })

  await tx.coupon.update({
    where: { id: base.id },
    data: {
      currentUses: { increment: 1 },
    },
  })

  await tx.couponUsage.create({
    data: {
      couponId: base.id,
      userId: userCoupon.userId,
      usedAt: redeemedAt,
      remainingUses,
      merchantStoreId: storeId,
    },
  })

  await touchUserMerchantActivity(tx, {
    userId: userCoupon.userId,
    merchantId: base.merchantId,
  })
}
