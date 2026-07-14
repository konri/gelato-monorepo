import { Field, ObjectType } from 'type-graphql'
import { OperatorScopeMode, OperatorScopeModeType } from '../../Cooperator/objectType/OperatorScopeMode'
import { OperatorPermission, OperatorPermissionType } from '../../Cooperator/objectType/OperatorPermission'

@ObjectType({
  description: 'Resolved edit flags for a merchant operator scope (derived from scope mode and permissions).',
})
export class OperatorMerchantEditCapabilities {
  @Field(() => Boolean, {
    description:
      'Merchant-wide default config (profile, base coupons/rewards/stamps/streaks, points program rules): requires FULL_MERCHANT scope plus the relevant write permission.',
  })
  canEditMerchantBaseConfig: boolean

  @Field(() => Boolean, {
    description: 'Per-store coupon overrides: COUPON_OVERRIDE_WRITE on this scope.',
  })
  canEditCouponStoreOverrides: boolean

  @Field(() => Boolean, {
    description: 'Per-store reward overrides: REWARD_OVERRIDE_WRITE on this scope.',
  })
  canEditRewardStoreOverrides: boolean

  @Field(() => Boolean, {
    description: 'Per-store streak overrides: STREAK_OVERRIDE_WRITE on this scope.',
  })
  canEditStreakStoreOverrides: boolean

  @Field(() => Boolean, {
    description: 'Merchant-wide base coupon definitions: FULL_MERCHANT scope and COUPON_BASE_WRITE.',
  })
  canEditGlobalCoupons: boolean

  @Field(() => Boolean, {
    description: 'Merchant-wide base reward definitions: FULL_MERCHANT scope and REWARD_BASE_WRITE.',
  })
  canEditGlobalRewards: boolean

  @Field(() => Boolean, {
    description: 'Merchant profile (merchant-wide): FULL_MERCHANT scope and MERCHANT_PROFILE_WRITE.',
  })
  canEditMerchantProfile: boolean

  @Field(() => Boolean, {
    description: 'Merchant-wide base stamp templates: FULL_MERCHANT scope and STAMP_TEMPLATE_BASE_WRITE.',
  })
  canEditGlobalStampTemplates: boolean

  @Field(() => Boolean, {
    description: 'Merchant-wide base streak programs: FULL_MERCHANT scope and STREAK_BASE_WRITE.',
  })
  canEditGlobalStreaks: boolean

  @Field(() => Boolean, {
    description: 'Merchant-wide points program rules: FULL_MERCHANT scope and POINTS_PROGRAM_WRITE.',
  })
  canEditMerchantPointsProgram: boolean
}

@ObjectType()
export class OperatorMerchantCapability {
  @Field(() => String)
  merchantId: string

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean)
  storeScopeAll: boolean

  @Field(() => [String])
  storeIds: string[]

  @Field(() => OperatorMerchantEditCapabilities)
  editCapabilities: OperatorMerchantEditCapabilities
}

@ObjectType()
export class OperatorCapabilities {
  @Field(() => [String])
  roles: string[]

  @Field(() => Boolean)
  isAdmin: boolean

  @Field(() => Boolean)
  isOwner: boolean

  @Field(() => [OperatorMerchantCapability])
  merchantScopes: OperatorMerchantCapability[]
}
