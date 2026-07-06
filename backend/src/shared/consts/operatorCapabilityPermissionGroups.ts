import { OperatorPermission } from '@prisma/client'

export const MERCHANT_BASE_CONFIG_PERMISSIONS: OperatorPermission[] = [
  OperatorPermission.MERCHANT_PROFILE_WRITE,
  OperatorPermission.STAMP_TEMPLATE_BASE_WRITE,
  OperatorPermission.REWARD_BASE_WRITE,
  OperatorPermission.COUPON_BASE_WRITE,
  OperatorPermission.STREAK_BASE_WRITE,
  OperatorPermission.POINTS_PROGRAM_WRITE,
]

export const STORE_OVERRIDE_PERMISSIONS: OperatorPermission[] = [
  OperatorPermission.REWARD_OVERRIDE_WRITE,
  OperatorPermission.COUPON_OVERRIDE_WRITE,
  OperatorPermission.STREAK_OVERRIDE_WRITE,
]
