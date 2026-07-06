import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql'
import { Coupon as PrismaCoupon, CouponStoreOverride, OperatorPermission } from '@prisma/client'
import { Coupon } from '../objectType/Coupon'
import { AvailabilityType } from '../objectType/CouponType'
import { UserCoupon } from '../objectType/UserCoupon'
import { CreateCouponInput } from '../inputType/CreateCouponInput'
import { UpdateCouponInput } from '../inputType/UpdateCouponInput'
import { UpsertCouponStoreOverrideInput } from '../inputType/UpsertCouponStoreOverrideInput'
import { UserMerchantPointBalance } from '../objectType/UserMerchantPointBalance'
import { MerchantUserPointStatus } from '../objectType/MerchantUserPointStatus'
import { MerchantPointTransaction } from '../objectType/MerchantPointTransaction'
import { MerchantPointsProgram } from '../objectType/MerchantPointsProgram'
import { CouponUsage } from '../objectType/CouponUsage'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { MerchantPointsService } from '../service/MerchantPointsService'
import { LocationSearchInput } from '../../Location/inputType/LocationSearchInput'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import { UpsertMerchantPointsProgramInput } from '../inputType/UpsertMerchantPointsProgramInput'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { PushNotificationHelper } from '../../services/PushNotificationHelper'
import { mergePrismaCouponWithOverride } from '../service/couponMerge'
import type { CouponStoreOverrideLike } from '../service/couponMerge'
import { assertCouponClaimAllowed } from '../service/couponRules'
import { applyCouponRedemptionInTransaction } from '../service/couponRedemption'
import { bypassAssignedCouponVisibilityFilter, isCouponAssignableVisibleToViewer } from '../service/couponVisibility'
import {
  assertCouponTypeSpecificShape,
  assertCouponTypeSpecificShapeFromPrismaCoupon,
} from '../service/couponCreateValidation'

const CouponUpdateError = {
  notFound: 'COUPON_UPDATE_NOT_FOUND',
  noAccess: 'COUPON_UPDATE_NO_ACCESS',
  couponTypeLocked: 'COUPON_UPDATE_COUPON_TYPE_LOCKED',
  availabilityLocked: 'COUPON_UPDATE_AVAILABILITY_LOCKED',
  pointsCostLocked: 'COUPON_UPDATE_POINTS_COST_LOCKED',
  rewardLocked: 'COUPON_UPDATE_REWARD_LOCKED',
  exclusivityGroupsLocked: 'COUPON_UPDATE_EXCLUSIVITY_GROUPS_LOCKED',
  invalidDateRange: 'COUPON_UPDATE_INVALID_DATE_RANGE',
  pointsCostNegative: 'COUPON_UPDATE_POINTS_COST_NEGATIVE',
  priorityNegative: 'COUPON_UPDATE_PRIORITY_NEGATIVE',
  buyQuantityNegative: 'COUPON_UPDATE_BUY_QUANTITY_NEGATIVE',
  getQuantityNegative: 'COUPON_UPDATE_GET_QUANTITY_NEGATIVE',
  discountValueNegative: 'COUPON_UPDATE_DISCOUNT_VALUE_NEGATIVE',
  thresholdAmountNegative: 'COUPON_UPDATE_THRESHOLD_AMOUNT_NEGATIVE',
  discountAmountNegative: 'COUPON_UPDATE_DISCOUNT_AMOUNT_NEGATIVE',
  daysBeforeBirthdayNegative: 'COUPON_UPDATE_DAYS_BEFORE_BIRTHDAY_NEGATIVE',
  daysAfterBirthdayNegative: 'COUPON_UPDATE_DAYS_AFTER_BIRTHDAY_NEGATIVE',
  usesPerUserLimitNegative: 'COUPON_UPDATE_USES_PER_USER_LIMIT_NEGATIVE',
  globalUsageLimitBelowUsage: 'COUPON_UPDATE_GLOBAL_USAGE_LIMIT_BELOW_CURRENT_USES',
  globalUsageLimitNegative: 'COUPON_UPDATE_GLOBAL_USAGE_LIMIT_NEGATIVE',
  usesPerUserLimitDecreaseLocked: 'COUPON_UPDATE_USES_PER_USER_LIMIT_DECREASE_LOCKED',
  usesPerUserLimitSetLocked: 'COUPON_UPDATE_USES_PER_USER_LIMIT_SET_LOCKED',
  globalUsageLimitDecreaseLocked: 'COUPON_UPDATE_GLOBAL_USAGE_LIMIT_DECREASE_LOCKED',
  globalUsageLimitSetLocked: 'COUPON_UPDATE_GLOBAL_USAGE_LIMIT_SET_LOCKED',
  pointsAvailabilityRequiresPointsCost: 'COUPON_UPDATE_POINTS_AVAILABILITY_REQUIRES_POINTS_COST',
  freeAvailabilityRequiresNullPointsCost: 'COUPON_UPDATE_FREE_AVAILABILITY_REQUIRES_NULL_POINTS_COST',
  rewardNotFound: 'COUPON_UPDATE_REWARD_NOT_FOUND',
  rewardDifferentMerchant: 'COUPON_UPDATE_REWARD_DIFFERENT_MERCHANT',
}

const CouponClaimError = {
  conflictingCoupon: 'COUPON_CLAIM_CONFLICTING_COUPON',
}

const MerchantPointsProgramError = {
  readNoAccess: 'POINTS_PROGRAM_READ_NO_ACCESS',
  writeNoAccess: 'POINTS_PROGRAM_WRITE_NO_ACCESS',
}

@Resolver(() => Coupon)
export class CouponResolver {
  private merchantPointsService: MerchantPointsService

  private async resolveMerchantIdForOperator(ctx: Context, requiredPermission?: OperatorPermission): Promise<string> {
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const merchantId = requiredPermission
      ? await merchantAccessService.resolvePrimaryMerchantIdByPermission(user.id, user.roles, requiredPermission)
      : await merchantAccessService.resolvePrimaryMerchantId(user.id, user.roles)
    if (!merchantId) {
      throw new ErrorWithStatus(404, 'Merchant not found for this user')
    }
    return merchantId
  }

  private async ensureMerchantAccess(
    merchantId: string,
    ctx: Context,
    errorCode = CouponUpdateError.noAccess
  ): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, errorCode)
    }
  }

  private async ensureCanEditCouponBase(merchantId: string, ctx: Context): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditBase = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.COUPON_BASE_WRITE
    )
    if (!canEditBase) {
      throw new ErrorWithStatus(403, 'No access to edit merchant-wide configuration (full merchant scope required)')
    }
  }

  private async ensureCanEditCouponOverride(merchantId: string, ctx: Context): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditOverride = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.COUPON_OVERRIDE_WRITE
    )
    if (!canEditOverride) {
      throw new ErrorWithStatus(403, 'No access to edit coupon store overrides')
    }
  }

  private async ensureStoreAccess(merchantId: string, storeId: string, ctx: Context): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasStoreAccess = await merchantAccessService.ensureStoreAccess(user.id, user.roles, merchantId, storeId)
    if (!hasStoreAccess) {
      throw new ErrorWithStatus(403, 'No access to this store')
    }
  }

  private applyCouponStoreOverride(coupon: Coupon, override: CouponStoreOverride | null): Coupon {
    return (mergePrismaCouponWithOverride((coupon as unknown) as PrismaCoupon, override) as unknown) as Coupon
  }

  private attachCouponScopeMetadata(coupon: Coupon, activeOverrideStoreIds: string[]): Coupon {
    const uniqueStoreIds = Array.from(new Set(activeOverrideStoreIds))
    const availableStoreIds = coupon.isActive ? [] : uniqueStoreIds
    return {
      ...coupon,
      availableStoreIds,
    }
  }

  private async ensureCouponUpdateAccess(coupon: PrismaCoupon, ctx: Context): Promise<void> {
    await this.ensureMerchantAccess(coupon.merchantId, ctx)
  }

  private static areSameExclusivityGroups(currentGroups: string[], nextGroups: string[]): boolean {
    const sortedCurrentGroups = [...currentGroups].sort()
    const sortedNextGroups = [...nextGroups].sort()
    return (
      sortedCurrentGroups.length === sortedNextGroups.length &&
      sortedCurrentGroups.every((value, index) => value === sortedNextGroups[index])
    )
  }

  private static upsertOverrideDataToUpdatePatch(data: UpsertCouponStoreOverrideInput): UpdateCouponInput {
    const { shortDescription: _s, termsAndConditions: _t, ...patch } = data
    return patch
  }

  private static assigneeVisibilityPrismaWhere(ctx: Context): Record<string, unknown> {
    if (bypassAssignedCouponVisibilityFilter(ctx)) {
      return {}
    }
    const viewerId = ctx.req.user?.id
    if (!viewerId) {
      return { assignToUserId: null }
    }
    return {
      OR: [{ assignToUserId: null }, { assignToUserId: viewerId }],
    }
  }

  private static filterCouponsVisibleToViewer<T extends { assignToUserId?: string | null }>(
    coupons: T[],
    ctx: Context
  ): T[] {
    if (bypassAssignedCouponVisibilityFilter(ctx)) {
      return coupons
    }
    const viewerId = ctx.req.user?.id
    return coupons.filter((c) => isCouponAssignableVisibleToViewer(c.assignToUserId ?? null, viewerId))
  }

  private static mergePrismaCouponWithUpdateInput(coupon: PrismaCoupon, data: UpdateCouponInput): PrismaCoupon {
    const definedEntries = Object.entries(data).filter(([, v]) => v !== undefined)
    return { ...coupon, ...Object.fromEntries(definedEntries) }
  }

  private static validateLockedFieldsAfterClaim(
    coupon: PrismaCoupon,
    data: UpdateCouponInput,
    hasBeenClaimed: boolean
  ): void {
    if (!hasBeenClaimed) {
      return
    }

    if (data.couponType !== undefined && data.couponType !== coupon.couponType) {
      throw new ErrorWithStatus(409, CouponUpdateError.couponTypeLocked)
    }
    if (data.availability !== undefined && data.availability !== coupon.availability) {
      throw new ErrorWithStatus(409, CouponUpdateError.availabilityLocked)
    }
    if (data.pointsCost !== undefined && data.pointsCost !== coupon.pointsCost) {
      throw new ErrorWithStatus(409, CouponUpdateError.pointsCostLocked)
    }
    if (data.rewardId !== undefined && data.rewardId !== coupon.rewardId) {
      throw new ErrorWithStatus(409, CouponUpdateError.rewardLocked)
    }
    if (
      data.exclusivityGroups !== undefined &&
      !CouponResolver.areSameExclusivityGroups(coupon.exclusivityGroups, data.exclusivityGroups)
    ) {
      throw new ErrorWithStatus(409, CouponUpdateError.exclusivityGroupsLocked)
    }
  }

  private static validateNumbers(coupon: PrismaCoupon, data: UpdateCouponInput): void {
    if (data.pointsCost !== undefined && data.pointsCost !== null && data.pointsCost < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.pointsCostNegative)
    }
    if (data.priority !== undefined && data.priority < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.priorityNegative)
    }
    if (data.buyQuantity !== undefined && data.buyQuantity !== null && data.buyQuantity < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.buyQuantityNegative)
    }
    if (data.getQuantity !== undefined && data.getQuantity !== null && data.getQuantity < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.getQuantityNegative)
    }
    if (data.discountValue !== undefined && data.discountValue !== null && data.discountValue < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.discountValueNegative)
    }
    if (data.thresholdAmount !== undefined && data.thresholdAmount !== null && data.thresholdAmount < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.thresholdAmountNegative)
    }
    if (data.discountAmount !== undefined && data.discountAmount !== null && data.discountAmount < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.discountAmountNegative)
    }
    if (data.daysBeforeBirthday !== undefined && data.daysBeforeBirthday !== null && data.daysBeforeBirthday < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.daysBeforeBirthdayNegative)
    }
    if (data.daysAfterBirthday !== undefined && data.daysAfterBirthday !== null && data.daysAfterBirthday < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.daysAfterBirthdayNegative)
    }
    if (data.usesPerUserLimit !== undefined && data.usesPerUserLimit !== null && data.usesPerUserLimit < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.usesPerUserLimitNegative)
    }
    if (
      data.globalUsageLimit !== undefined &&
      data.globalUsageLimit !== null &&
      data.globalUsageLimit < coupon.currentUses
    ) {
      throw new ErrorWithStatus(400, CouponUpdateError.globalUsageLimitBelowUsage)
    }
    if (data.globalUsageLimit !== undefined && data.globalUsageLimit !== null && data.globalUsageLimit < 0) {
      throw new ErrorWithStatus(400, CouponUpdateError.globalUsageLimitNegative)
    }
  }

  private static validateLimitsAfterUsage(coupon: PrismaCoupon, data: UpdateCouponInput, hasBeenUsed: boolean): void {
    if (!hasBeenUsed) {
      return
    }

    if (data.usesPerUserLimit !== undefined) {
      const currentLimit = coupon.usesPerUserLimit
      const nextLimit = data.usesPerUserLimit
      if (currentLimit !== null && currentLimit !== undefined && nextLimit !== null && nextLimit < currentLimit) {
        throw new ErrorWithStatus(409, CouponUpdateError.usesPerUserLimitDecreaseLocked)
      }
      if ((currentLimit === null || currentLimit === undefined) && nextLimit !== null && nextLimit !== undefined) {
        throw new ErrorWithStatus(409, CouponUpdateError.usesPerUserLimitSetLocked)
      }
    }

    if (data.globalUsageLimit !== undefined) {
      const currentGlobalLimit = coupon.globalUsageLimit
      const nextGlobalLimit = data.globalUsageLimit
      if (
        currentGlobalLimit !== null &&
        currentGlobalLimit !== undefined &&
        nextGlobalLimit !== null &&
        nextGlobalLimit < currentGlobalLimit
      ) {
        throw new ErrorWithStatus(409, CouponUpdateError.globalUsageLimitDecreaseLocked)
      }
      if (
        (currentGlobalLimit === null || currentGlobalLimit === undefined) &&
        nextGlobalLimit !== null &&
        nextGlobalLimit !== undefined
      ) {
        throw new ErrorWithStatus(409, CouponUpdateError.globalUsageLimitSetLocked)
      }
    }
  }

  private static validateAvailabilityAndPoints(coupon: PrismaCoupon, data: UpdateCouponInput): void {
    const nextAvailability = data.availability ?? coupon.availability
    const nextPointsCost = data.pointsCost !== undefined ? data.pointsCost : coupon.pointsCost
    if (
      nextAvailability === 'POINTS' &&
      (nextPointsCost === null || nextPointsCost === undefined || nextPointsCost <= 0)
    ) {
      throw new ErrorWithStatus(400, CouponUpdateError.pointsAvailabilityRequiresPointsCost)
    }
    if (nextAvailability === 'FREE' && nextPointsCost !== null && nextPointsCost !== undefined) {
      throw new ErrorWithStatus(400, CouponUpdateError.freeAvailabilityRequiresNullPointsCost)
    }
  }

  private static hasSharedExclusivityGroups(firstGroups: string[], secondGroups: string[]): boolean {
    if (firstGroups.length === 0 || secondGroups.length === 0) {
      return false
    }
    const secondGroupsSet = new Set(secondGroups)
    return firstGroups.some((group) => secondGroupsSet.has(group))
  }

  private static areCouponsCompatible(firstCoupon: PrismaCoupon, secondCoupon: PrismaCoupon): boolean {
    if (!firstCoupon.isStackable || !secondCoupon.isStackable) {
      return false
    }

    return !CouponResolver.hasSharedExclusivityGroups(firstCoupon.exclusivityGroups, secondCoupon.exclusivityGroups)
  }

  private static validateClaimCouponCompatibility(coupon: PrismaCoupon, activeCoupons: PrismaCoupon[]): void {
    const hasConflict = activeCoupons.some((activeCoupon) => !CouponResolver.areCouponsCompatible(coupon, activeCoupon))
    if (hasConflict) {
      throw new ErrorWithStatus(409, CouponClaimError.conflictingCoupon)
    }
  }

  private async validateRewardAccess(coupon: PrismaCoupon, data: UpdateCouponInput, ctx: Context): Promise<void> {
    if (data.rewardId === undefined || data.rewardId === null) {
      return
    }

    const reward = await ctx.prisma.reward.findUnique({
      where: { id: data.rewardId },
    })
    if (!reward) {
      throw new ErrorWithStatus(400, CouponUpdateError.rewardNotFound)
    }

    const user = ctx.req.user!
    if (reward.merchantId && reward.merchantId !== coupon.merchantId && !user.roles.includes(Role.ADMIN)) {
      throw new ErrorWithStatus(403, CouponUpdateError.rewardDifferentMerchant)
    }
  }

  constructor() {
    // Service will be initialized with prisma in each method
  }
  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Coupon)
  async createCoupon(
    @Arg('data') data: CreateCouponInput,
    @Arg('storeId', () => String, { nullable: true }) storeId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<Coupon> {
    let merchantId: string
    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { id: true, merchantId: true },
      })
      if (!store) {
        throw new ErrorWithStatus(404, 'Store not found')
      }
      merchantId = store.merchantId
      await this.ensureStoreAccess(merchantId, storeId, ctx)
      await this.ensureCanEditCouponOverride(merchantId, ctx)
    } else {
      merchantId = await this.resolveMerchantIdForOperator(ctx, OperatorPermission.COUPON_BASE_WRITE)
      await this.ensureCanEditCouponBase(merchantId, ctx)
    }

    // Check if coupon with this code already exists for this merchant
    const existingCoupon = await ctx.prisma.coupon.findFirst({
      where: {
        code: data.code,
        merchantId: merchantId,
      },
    })

    if (existingCoupon) {
      throw new Error(`Coupon with code "${data.code}" already exists for your merchant`)
    }

    assertCouponTypeSpecificShape({
      couponType: data.couponType,
      buyQuantity: data.buyQuantity,
      getQuantity: data.getQuantity,
      dayOfWeek: data.dayOfWeek,
      thresholdAmount: data.thresholdAmount,
      discountAmount: data.discountAmount,
      itemName: data.itemName,
      activityType: data.activityType,
      discountType: data.discountType,
      discountValue: data.discountValue,
    })

    const coupon = await ctx.prisma.coupon.create({
      data: {
        ...data,
        merchantId,
        isActive: storeId ? false : data.isActive ?? true,
        currentUses: 0,
        usesPerUserLimit: data.usesPerUserLimit,
        globalUsageLimit: data.globalUsageLimit,
        isStackable: data.isStackable || false,
      },
      include: { merchant: true, reward: true },
    })

    if (!storeId) {
      return this.attachCouponScopeMetadata((coupon as unknown) as Coupon, [])
    }

    const override = await ctx.prisma.couponStoreOverride.upsert({
      where: {
        UniqueCouponStoreOverride: {
          couponId: coupon.id,
          merchantStoreId: storeId,
        },
      },
      create: {
        couponId: coupon.id,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        isActive: data.isActive ?? true,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        isActive: data.isActive ?? true,
      },
    })

    return this.attachCouponScopeMetadata(this.applyCouponStoreOverride((coupon as unknown) as Coupon, override), [
      storeId,
    ])
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Coupon)
  async updateCoupon(
    @Arg('couponId') couponId: string,
    @Arg('data') data: UpdateCouponInput,
    @Ctx() ctx: Context
  ): Promise<Coupon> {
    const coupon = await ctx.prisma.coupon.findUnique({ where: { id: couponId } })
    if (!coupon) throw new ErrorWithStatus(404, CouponUpdateError.notFound)
    await this.ensureCouponUpdateAccess(coupon, ctx)
    await this.ensureCanEditCouponBase(coupon.merchantId, ctx)

    const userCouponCount = await ctx.prisma.userCoupon.count({
      where: { couponId },
    })
    const hasBeenClaimed = userCouponCount > 0
    const hasBeenUsed = coupon.currentUses > 0

    CouponResolver.validateLockedFieldsAfterClaim(coupon, data, hasBeenClaimed)

    const nextValidFrom = data.validFrom ?? coupon.validFrom
    const nextValidUntil = data.validUntil ?? coupon.validUntil

    if (nextValidFrom > nextValidUntil) {
      throw new ErrorWithStatus(400, CouponUpdateError.invalidDateRange)
    }

    CouponResolver.validateNumbers(coupon, data)
    CouponResolver.validateLimitsAfterUsage(coupon, data, hasBeenUsed)
    CouponResolver.validateAvailabilityAndPoints(coupon, data)
    await this.validateRewardAccess(coupon, data, ctx)

    assertCouponTypeSpecificShapeFromPrismaCoupon(CouponResolver.mergePrismaCouponWithUpdateInput(coupon, data))

    const updatedCoupon = await ctx.prisma.coupon.update({
      where: { id: couponId },
      data,
      include: { merchant: true, reward: true },
    })

    return (updatedCoupon as unknown) as Coupon
  }

  @Query(() => [Coupon])
  async availableCoupons(
    @Ctx() ctx: Context,
    @Arg('merchantId', { nullable: true }) merchantId?: string,
    @Arg('storeId', { nullable: true }) storeId?: string
  ): Promise<Coupon[]> {
    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store) {
        throw new ErrorWithStatus(404, 'Store not found')
      }
      if (merchantId && merchantId !== store.merchantId) {
        throw new ErrorWithStatus(400, 'Store does not belong to selected merchant')
      }
      merchantId = store.merchantId
    }

    const coupons = await ctx.prisma.coupon.findMany({
      where: {
        ...(merchantId && { merchantId }),
        ...(storeId ? {} : { isActive: true }),
        ...(storeId ? {} : { validFrom: { lte: new Date() }, validUntil: { gte: new Date() } }),
        ...CouponResolver.assigneeVisibilityPrismaWhere(ctx),
      },
      include: { merchant: true, reward: true },
      orderBy: [{ displayType: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })

    if (!storeId) {
      const overrides = await ctx.prisma.couponStoreOverride.findMany({
        where: {
          couponId: { in: coupons.map((coupon) => coupon.id) },
          isActive: true,
        },
        select: { couponId: true, merchantStoreId: true },
      })
      const overrideStoreIdsByCouponId = new Map<string, string[]>()
      for (const item of overrides) {
        const currentStoreIds = overrideStoreIdsByCouponId.get(item.couponId) ?? []
        currentStoreIds.push(item.merchantStoreId)
        overrideStoreIdsByCouponId.set(item.couponId, currentStoreIds)
      }
      return coupons.map((coupon) =>
        this.attachCouponScopeMetadata((coupon as unknown) as Coupon, overrideStoreIdsByCouponId.get(coupon.id) ?? [])
      )
    }

    const overrides = await ctx.prisma.couponStoreOverride.findMany({
      where: {
        merchantStoreId: storeId,
        couponId: { in: coupons.map((coupon) => coupon.id) },
      },
    })
    const overrideByCouponId = new Map(overrides.map((item) => [item.couponId, item]))
    const now = new Date()
    const merged = coupons.map((coupon) =>
      this.applyCouponStoreOverride((coupon as unknown) as Coupon, overrideByCouponId.get(coupon.id) ?? null)
    )
    return CouponResolver.filterCouponsVisibleToViewer(
      merged.filter((coupon) => coupon.isActive && coupon.validFrom <= now && coupon.validUntil >= now),
      ctx
    )
  }

  @Query(() => [Coupon])
  async availableCouponsByType(
    @Ctx() ctx: Context,
    @Arg('displayType', { nullable: true }) displayType?: string,
    @Arg('merchantId', { nullable: true }) merchantId?: string
  ): Promise<Coupon[]> {
    const coupons = await ctx.prisma.coupon.findMany({
      where: {
        ...(merchantId && { merchantId }),
        ...(displayType && { displayType: displayType as any }),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        ...CouponResolver.assigneeVisibilityPrismaWhere(ctx),
      },
      include: { merchant: true, reward: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return (coupons as unknown) as Coupon[]
  }

  @Query(() => [Coupon])
  async promotedCoupons(
    @Arg('location', () => LocationSearchInput, { nullable: true }) location?: LocationSearchInput,
    @Arg('displayType', { nullable: true }) displayType?: string,
    @Ctx() ctx?: Context
  ): Promise<Coupon[]> {
    const userId = ctx?.req.user?.id

    // If no location provided, use user's preferred city
    if (!location?.latitude || !location?.longitude) {
      if (!userId) {
        throw new Error('Authentication required when location not provided')
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredCity: true },
      })

      if (!user?.preferredCity) {
        throw new Error('User city required when location not provided')
      }

      // Get coupons from merchants with stores in user's city
      const coupons = await ctx.prisma.coupon.findMany({
        where: {
          ...(displayType && { displayType: displayType as any }),
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
          ...CouponResolver.assigneeVisibilityPrismaWhere(ctx!),
          merchant: {
            stores: {
              some: {
                city: { equals: user.preferredCity, mode: 'insensitive' },
                isActive: true,
              },
            },
          },
        },
        include: {
          merchant: {
            include: {
              category: true,
              stores: {
                where: {
                  city: { equals: user.preferredCity, mode: 'insensitive' },
                  isActive: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      })

      return (CouponResolver.filterCouponsVisibleToViewer(coupons, ctx!) as unknown) as Coupon[]
    }

    // Location-based search
    const { LocationService } = await import('../../Location/service/LocationService')
    const locationService = new LocationService(ctx!.prisma)
    const radiusKm = location.radiusKm || 50

    // Get all active coupons with merchant stores
    const coupons = await ctx!.prisma.coupon.findMany({
      where: {
        ...(displayType && { displayType: displayType as any }),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        ...CouponResolver.assigneeVisibilityPrismaWhere(ctx!),
        merchant: {
          stores: {
            some: {
              latitude: { not: null },
              longitude: { not: null },
              isActive: true,
            },
          },
        },
      },
      include: {
        merchant: {
          include: {
            category: true,
            stores: {
              where: {
                latitude: { not: null },
                longitude: { not: null },
                isActive: true,
              },
            },
          },
        },
      },
    })

    // Calculate distance for each coupon based on nearest store
    const couponsWithDistance = coupons
      .map((coupon: any) => {
        if (coupon.merchant.stores.length === 0) {
          return { coupon, distance: Infinity }
        }

        const storesWithDistance = coupon.merchant.stores.map((store: any) => ({
          store,
          distance: locationService.calculateDistance(
            location.latitude!,
            location.longitude!,
            store.latitude!,
            store.longitude!
          ),
        }))

        const nearestStore = storesWithDistance.sort((a: any, b: any) => a.distance - b.distance)[0]
        const distanceInMeters = Math.round(nearestStore.distance * 1000)

        return {
          coupon: { ...coupon, distance: distanceInMeters },
          distance: nearestStore.distance,
        }
      })
      .filter((item: any) => item.distance <= radiusKm)
      .sort((a: any, b: any) => {
        if (a.coupon.priority !== b.coupon.priority) {
          return b.coupon.priority - a.coupon.priority
        }
        return a.distance - b.distance
      })
      .map((item: any) => item.coupon)

    return (CouponResolver.filterCouponsVisibleToViewer(couponsWithDistance, ctx!) as unknown) as Coupon[]
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [Coupon])
  async myMerchantCoupons(
    @Ctx() ctx: Context,
    @Arg('storeId', () => String, { nullable: true }) storeId?: string
  ): Promise<Coupon[]> {
    const merchantId = await this.resolveMerchantIdForOperator(ctx, OperatorPermission.COUPON_READ)
    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { id: true, merchantId: true },
      })
      if (!store || store.merchantId !== merchantId) {
        throw new ErrorWithStatus(400, 'Store does not belong to selected merchant')
      }
      await this.ensureStoreAccess(merchantId, storeId, ctx)
    }

    const coupons = await ctx.prisma.coupon.findMany({
      where: {
        merchantId,
        ...(storeId ? {} : {}),
      },
      include: { merchant: true, reward: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!storeId) {
      const overrides = await ctx.prisma.couponStoreOverride.findMany({
        where: {
          couponId: { in: coupons.map((coupon) => coupon.id) },
          isActive: true,
        },
        select: { couponId: true, merchantStoreId: true },
      })
      const overrideStoreIdsByCouponId = new Map<string, string[]>()
      for (const item of overrides) {
        const currentStoreIds = overrideStoreIdsByCouponId.get(item.couponId) ?? []
        currentStoreIds.push(item.merchantStoreId)
        overrideStoreIdsByCouponId.set(item.couponId, currentStoreIds)
      }
      return coupons
        .map((coupon) =>
          this.attachCouponScopeMetadata((coupon as unknown) as Coupon, overrideStoreIdsByCouponId.get(coupon.id) ?? [])
        )
        .filter((coupon) => coupon.isActive || (coupon.availableStoreIds ?? []).length > 0)
    }

    const overrides = await ctx.prisma.couponStoreOverride.findMany({
      where: {
        merchantStoreId: storeId,
        couponId: { in: coupons.map((coupon) => coupon.id) },
      },
    })
    const overrideByCouponId = new Map(overrides.map((item) => [item.couponId, item]))
    return coupons
      .map((coupon) =>
        this.attachCouponScopeMetadata(
          this.applyCouponStoreOverride((coupon as unknown) as Coupon, overrideByCouponId.get(coupon.id) ?? null),
          [storeId]
        )
      )
      .filter((coupon) => coupon.isActive)
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [UserCoupon])
  async myCoupons(@Ctx() ctx: Context): Promise<UserCoupon[]> {
    const userId = ctx.req.user!.id

    // Get user's coupons
    const userCoupons = await ctx.prisma.userCoupon.findMany({
      where: { userId },
      include: {
        coupon: {
          include: { merchant: true, reward: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return userCoupons as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => UserCoupon)
  async claimCoupon(
    @Arg('couponId') couponId: string,
    @Arg('storeId', () => String, { nullable: true }) storeId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<UserCoupon> {
    const userId = ctx.req.user!.id

    const coupon = await ctx.prisma.coupon.findUnique({
      where: { id: couponId },
      include: { merchant: true, reward: true },
    })

    if (!coupon) {
      throw new ErrorWithStatus(404, 'Coupon not found')
    }

    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store || store.merchantId !== coupon.merchantId) {
        throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
      }
    }

    const override = storeId
      ? await ctx.prisma.couponStoreOverride.findUnique({
          where: {
            UniqueCouponStoreOverride: {
              couponId,
              merchantStoreId: storeId,
            },
          },
        })
      : null

    const effective = mergePrismaCouponWithOverride(coupon, override)

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    })

    const now = new Date()
    assertCouponClaimAllowed({
      userId,
      birthDate: user?.birthDate ?? null,
      now,
      baseCurrentUses: coupon.currentUses,
      effective,
    })

    const existingUserCoupon = await ctx.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
    })

    if (existingUserCoupon) {
      throw new ErrorWithStatus(409, 'You already have this coupon')
    }

    const activeUserCoupons = await ctx.prisma.userCoupon.findMany({
      where: {
        userId,
        isUsed: false,
        couponId: { not: couponId },
        coupon: {
          merchantId: coupon.merchantId,
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      },
      include: {
        coupon: true,
      },
    })
    CouponResolver.validateClaimCouponCompatibility(
      effective,
      activeUserCoupons.map((userCoupon) => userCoupon.coupon)
    )

    if (effective.availability === 'POINTS' && effective.pointsCost && effective.pointsCost > 0) {
      this.merchantPointsService = new MerchantPointsService(ctx.prisma)

      await this.merchantPointsService.spendMerchantPoints(
        userId,
        coupon.merchantId,
        effective.pointsCost,
        `Coupon: ${effective.title}`,
        couponId,
        'COUPON',
        storeId
      )
    }

    const userCoupon = await ctx.prisma.userCoupon.create({
      data: {
        userId,
        couponId,
        isUsed: false,
      },
      include: {
        coupon: {
          include: { merchant: true, reward: true },
        },
        user: true,
      },
    })

    const { ReferralService } = await import('../../Referral/service/ReferralService')
    await ReferralService.awardReferralPoints(userId, 'CLIENT_ACTIVE')

    const userRewardService = new UserRewardService(ctx.prisma)
    await userRewardService.upsertReward({
      userId,
      sourceType: UserRewardSourceType.COUPON,
      sourceEntityId: coupon.id,
      status: UserRewardStatus.CLAIMED,
      title: coupon.reward?.title ?? effective.title,
      description: coupon.reward?.description ?? effective.description ?? undefined,
      merchantId: coupon.merchantId,
      rewardId: effective.rewardId ?? undefined,
      claimedAt: new Date(),
      pointsCost: effective.pointsCost ?? undefined,
    })
    await userRewardService.refreshAvailableRewardsForUser(userId, [coupon.merchantId])

    // Send push notification
    await PushNotificationHelper.sendCouponAvailable({
      userId,
      couponTitle: coupon.title,
      merchantName: coupon.merchant.name,
      validUntil: coupon.validUntil,
      prisma: ctx.prisma,
    })

    return userCoupon as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => Coupon)
  async userCouponByQr(@Arg('qrCode') qrCode: string, @Ctx() ctx: Context): Promise<Coupon> {
    const userCoupon = await ctx.prisma.userCoupon.findUnique({
      where: { qrCode },
      include: {
        coupon: {
          include: { merchant: true, reward: true },
        },
        user: true,
      },
    })

    if (!userCoupon) {
      throw new Error('Coupon not found')
    }
    await this.ensureMerchantAccess(userCoupon.coupon.merchantId, ctx)

    return userCoupon.coupon as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async useCouponByQr(
    @Arg('qrCode') qrCode: string,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const userCoupon = await ctx.prisma.userCoupon.findUnique({
      where: { qrCode },
      include: { coupon: true, user: true },
    })

    if (!userCoupon) {
      throw new ErrorWithStatus(404, 'Coupon not found')
    }
    await this.ensureMerchantAccess(userCoupon.coupon.merchantId, ctx)

    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    })
    if (!store || store.merchantId !== userCoupon.coupon.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
    }

    const override = await ctx.prisma.couponStoreOverride.findUnique({
      where: {
        UniqueCouponStoreOverride: {
          couponId: userCoupon.couponId,
          merchantStoreId: storeId,
        },
      },
    })

    const redeemer = await ctx.prisma.user.findUnique({
      where: { id: userCoupon.userId },
      select: { birthDate: true },
    })

    const redeemedAt = new Date()

    await ctx.prisma.$transaction(async (tx) => {
      const fresh = await tx.userCoupon.findUnique({
        where: { qrCode },
        include: { coupon: true },
      })
      if (!fresh) {
        throw new ErrorWithStatus(404, 'Coupon not found')
      }

      await applyCouponRedemptionInTransaction(tx, {
        userCoupon: fresh,
        storeId,
        override,
        birthDate: redeemer?.birthDate ?? null,
        redeemedAt,
      })

      const userRewardService = new UserRewardService(tx)
      const merged = mergePrismaCouponWithOverride(fresh.coupon, override)
      await userRewardService.upsertReward({
        userId: fresh.userId,
        sourceType: UserRewardSourceType.COUPON,
        sourceEntityId: fresh.couponId,
        status: UserRewardStatus.REDEEMED,
        title: merged.title,
        description: undefined,
        merchantId: fresh.coupon.merchantId,
        rewardId: merged.rewardId ?? undefined,
        claimedAt: fresh.createdAt,
        redeemedAt,
        pointsCost: merged.pointsCost ?? undefined,
        qrCode: fresh.qrCode,
      })
    })

    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async useCoupon(
    @Arg('couponId') couponId: string,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const userId = ctx.req.user!.id

    const userCoupon = await ctx.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
      include: { coupon: true },
    })

    if (!userCoupon) {
      throw new ErrorWithStatus(404, 'Coupon not found in your collection')
    }

    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    })
    if (!store || store.merchantId !== userCoupon.coupon.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
    }

    const override = await ctx.prisma.couponStoreOverride.findUnique({
      where: {
        UniqueCouponStoreOverride: {
          couponId,
          merchantStoreId: storeId,
        },
      },
    })

    const redeemer = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    })

    const redeemedAt = new Date()

    await ctx.prisma.$transaction(async (tx) => {
      const fresh = await tx.userCoupon.findUnique({
        where: {
          userId_couponId: {
            userId,
            couponId,
          },
        },
        include: { coupon: true },
      })
      if (!fresh) {
        throw new ErrorWithStatus(404, 'Coupon not found in your collection')
      }

      await applyCouponRedemptionInTransaction(tx, {
        userCoupon: fresh,
        storeId,
        override,
        birthDate: redeemer?.birthDate ?? null,
        redeemedAt,
      })

      const userRewardService = new UserRewardService(tx)
      const merged = mergePrismaCouponWithOverride(fresh.coupon, override)
      await userRewardService.upsertReward({
        userId,
        sourceType: UserRewardSourceType.COUPON,
        sourceEntityId: couponId,
        status: UserRewardStatus.REDEEMED,
        title: merged.title,
        description: undefined,
        merchantId: fresh.coupon.merchantId,
        rewardId: merged.rewardId ?? undefined,
        claimedAt: fresh.createdAt,
        redeemedAt,
        pointsCost: merged.pointsCost ?? undefined,
        qrCode: fresh.qrCode,
      })
    })

    return true
  }

  // Merchant Points Management - For Clients (requires merchantId)
  @Authorized([Role.CLIENT])
  @Query(() => UserMerchantPointBalance)
  async myMerchantPointBalance(
    @Arg('merchantId') merchantId: string,
    @Ctx() ctx: Context
  ): Promise<UserMerchantPointBalance> {
    const userId = ctx.req.user!.id
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const balance = await this.merchantPointsService.getMerchantPointBalance(userId, merchantId)
    return balance as UserMerchantPointBalance
  }

  @Authorized([Role.CLIENT])
  @Query(() => [UserMerchantPointBalance])
  async myAllMerchantPointBalances(@Ctx() ctx: Context): Promise<UserMerchantPointBalance[]> {
    const userId = ctx.req.user!.id

    const balances = await ctx.prisma.userMerchantPointBalance.findMany({
      where: { userId },
      include: {
        merchant: {
          include: {
            category: true,
            stores: true,
            vouchers: true,
          },
        },
        user: true,
      },
    })

    return balances as any
  }

  @Authorized([Role.CLIENT])
  @Query(() => [MerchantPointTransaction])
  async myMerchantPointTransactions(
    @Arg('merchantId') merchantId: string,
    @Ctx() ctx: Context
  ): Promise<MerchantPointTransaction[]> {
    const userId = ctx.req.user!.id
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const transactions = await this.merchantPointsService.getMerchantPointTransactions(userId, merchantId)
    return transactions as any
  }

  // Merchant Points Management - For Merchants (auto-detect merchantId)
  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => MerchantUserPointStatus)
  async merchantUserPointBalance(
    @Arg('merchantId') merchantId: string,
    @Arg('userId') userId: string,
    @Ctx() ctx: Context
  ): Promise<MerchantUserPointStatus> {
    await this.ensureMerchantAccess(merchantId, ctx, MerchantPointsProgramError.readNoAccess)
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const balance = await this.merchantPointsService.getMerchantPointBalance(userId, merchantId)
    return {
      userId: balance.userId,
      merchantId: balance.merchantId,
      totalPoints: balance.totalPoints,
      availablePoints: balance.availablePoints,
      lockedPoints: balance.lockedPoints,
      bonusMultiplier: balance.bonusMultiplier,
      fixedPoints: balance.fixedPoints,
      createdAt: balance.createdAt,
      updatedAt: balance.updatedAt,
    }
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => UserMerchantPointBalance)
  async myOwnMerchantPointBalance(@Ctx() ctx: Context): Promise<UserMerchantPointBalance> {
    const userId = ctx.req.user!.id
    const merchantId = await this.resolveMerchantIdForOperator(ctx, OperatorPermission.POINTS_PROGRAM_READ)
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const balance = await this.merchantPointsService.getMerchantPointBalance(userId, merchantId)
    return balance as UserMerchantPointBalance
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [MerchantPointTransaction])
  async myOwnMerchantPointTransactions(@Ctx() ctx: Context): Promise<MerchantPointTransaction[]> {
    const userId = ctx.req.user!.id
    const merchantId = await this.resolveMerchantIdForOperator(ctx, OperatorPermission.POINTS_PROGRAM_READ)
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const transactions = await this.merchantPointsService.getMerchantPointTransactions(userId, merchantId)
    return transactions as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => MerchantPointsProgram, { nullable: true })
  async getMerchantPointsProgram(
    @Arg('merchantId') merchantId: string,
    @Ctx() ctx: Context
  ): Promise<MerchantPointsProgram | null> {
    await this.ensureMerchantAccess(merchantId, ctx, MerchantPointsProgramError.readNoAccess)
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canReadPointsProgram = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.POINTS_PROGRAM_READ
    )
    if (!canReadPointsProgram) {
      throw new ErrorWithStatus(403, MerchantPointsProgramError.readNoAccess)
    }

    return (await ctx.prisma.merchantPointsProgram.findUnique({
      where: { merchantId },
      include: { merchant: true },
    })) as MerchantPointsProgram | null
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => MerchantPointsProgram)
  async saveMerchantPointsProgram(
    @Arg('merchantId') merchantId: string,
    @Arg('data') data: UpsertMerchantPointsProgramInput,
    @Ctx() ctx: Context
  ): Promise<MerchantPointsProgram> {
    await this.ensureMerchantAccess(merchantId, ctx, MerchantPointsProgramError.writeNoAccess)
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditPointsProgram = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.POINTS_PROGRAM_WRITE
    )
    if (!canEditPointsProgram) {
      throw new ErrorWithStatus(403, MerchantPointsProgramError.writeNoAccess)
    }

    if (data.amountSpent <= 0) {
      throw new ErrorWithStatus(400, 'amountSpent must be greater than 0')
    }
    if (data.pointsAwarded <= 0) {
      throw new ErrorWithStatus(400, 'pointsAwarded must be greater than 0')
    }

    const cardMessage = data.cardMessage?.trim() || null
    const program = await ctx.prisma.merchantPointsProgram.upsert({
      where: { merchantId },
      create: {
        merchantId,
        amountSpent: data.amountSpent,
        pointsAwarded: data.pointsAwarded,
        cardMessage,
        isActive: data.isActive ?? true,
      },
      update: {
        amountSpent: data.amountSpent,
        pointsAwarded: data.pointsAwarded,
        cardMessage,
        isActive: data.isActive ?? true,
      },
      include: { merchant: true },
    })

    return program as MerchantPointsProgram
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => UserMerchantPointBalance)
  async addMerchantPoints(
    @Arg('userId') userId: string,
    @Arg('programId') programId: string,
    @Arg('amount') amount: number,
    @Arg('description') description: string,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<UserMerchantPointBalance> {
    const pointsProgram = await ctx.prisma.merchantPointsProgram.findUnique({
      where: { id: programId },
      select: { merchantId: true },
    })
    if (!pointsProgram) {
      throw new ErrorWithStatus(404, 'Merchant points program not found')
    }
    await this.ensureMerchantAccess(pointsProgram.merchantId, ctx, MerchantPointsProgramError.writeNoAccess)

    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    const balance = await this.merchantPointsService.addMerchantPoints(userId, programId, amount, description, storeId)

    return balance as UserMerchantPointBalance
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [CouponUsage])
  async myCouponUsageHistory(@Ctx() ctx: Context): Promise<CouponUsage[]> {
    const userId = ctx.req.user!.id

    const usages = await ctx.prisma.couponUsage.findMany({
      where: { userId },
      include: {
        coupon: {
          include: { merchant: true, reward: true },
        },
        user: true,
      },
      orderBy: { usedAt: 'desc' },
    })

    return usages as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async unclaimCoupon(
    @Arg('couponId') couponId: string,
    @Arg('storeId', () => String, { nullable: true }) storeId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const userId = ctx.req.user!.id

    const userCoupon = await ctx.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
      include: { coupon: true },
    })

    if (!userCoupon) {
      throw new Error('Coupon not found in your collection')
    }

    if (userCoupon.isUsed) {
      throw new Error('Cannot unclaim a used coupon')
    }

    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store || store.merchantId !== userCoupon.coupon.merchantId) {
        throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
      }
    }

    const rewardRow = await ctx.prisma.userReward.findUnique({
      where: {
        UniqueUserRewardSource: {
          userId,
          sourceType: UserRewardSourceType.COUPON,
          sourceEntityId: couponId,
          sourceSubEntityId: '',
        },
      },
    })

    const override = storeId
      ? await ctx.prisma.couponStoreOverride.findUnique({
          where: {
            UniqueCouponStoreOverride: {
              couponId,
              merchantStoreId: storeId,
            },
          },
        })
      : null
    const effectiveForFallback = mergePrismaCouponWithOverride(userCoupon.coupon, override)

    const refundPoints =
      rewardRow?.pointsCost != null && rewardRow.pointsCost > 0
        ? rewardRow.pointsCost
        : effectiveForFallback.availability === 'POINTS' &&
          effectiveForFallback.pointsCost != null &&
          effectiveForFallback.pointsCost > 0
        ? effectiveForFallback.pointsCost
        : null

    if (refundPoints != null) {
      this.merchantPointsService = new MerchantPointsService(ctx.prisma)
      const pointsProgram = await ctx.prisma.merchantPointsProgram.findUnique({
        where: { merchantId: userCoupon.coupon.merchantId },
        select: { id: true },
      })
      if (!pointsProgram) {
        throw new ErrorWithStatus(409, 'Cannot refund points without merchant points program')
      }

      await this.merchantPointsService.addMerchantPoints(
        userId,
        pointsProgram.id,
        refundPoints,
        `Refund: ${userCoupon.coupon.title}`,
        storeId,
        undefined,
        undefined,
        false,
        false
      )
    }

    await ctx.prisma.userCoupon.delete({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
    })

    const userRewardService = new UserRewardService(ctx.prisma)
    const rewardPointsCost =
      rewardRow?.pointsCost != null && rewardRow.pointsCost > 0
        ? rewardRow.pointsCost
        : effectiveForFallback.pointsCost ?? undefined
    await userRewardService.upsertReward({
      userId,
      sourceType: UserRewardSourceType.COUPON,
      sourceEntityId: couponId,
      status: UserRewardStatus.CANCELLED,
      title: userCoupon.coupon.title,
      description: undefined,
      merchantId: userCoupon.coupon.merchantId,
      rewardId: userCoupon.coupon.rewardId ?? undefined,
      claimedAt: userCoupon.createdAt,
      pointsCost: rewardPointsCost,
      qrCode: userCoupon.qrCode,
    })
    await userRewardService.refreshAvailableRewardsForUser(userId, [userCoupon.coupon.merchantId])

    return true
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Coupon)
  async upsertCouponStoreOverride(
    @Arg('couponId') couponId: string,
    @Arg('storeId') storeId: string,
    @Arg('data') data: UpsertCouponStoreOverrideInput,
    @Ctx() ctx: Context
  ): Promise<Coupon> {
    const coupon = await ctx.prisma.coupon.findUnique({
      where: { id: couponId },
      include: { merchant: true, reward: true },
    })
    if (!coupon) {
      throw new ErrorWithStatus(404, 'Coupon not found')
    }
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true },
    })
    if (!store || store.merchantId !== coupon.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
    }
    await this.ensureStoreAccess(coupon.merchantId, storeId, ctx)
    await this.ensureCanEditCouponOverride(coupon.merchantId, ctx)

    const existingOverride = await ctx.prisma.couponStoreOverride.findUnique({
      where: {
        UniqueCouponStoreOverride: {
          couponId,
          merchantStoreId: storeId,
        },
      },
    })

    const userCouponCount = await ctx.prisma.userCoupon.count({
      where: { couponId },
    })
    const hasBeenClaimed = userCouponCount > 0
    const hasBeenUsed = coupon.currentUses > 0
    const patch = CouponResolver.upsertOverrideDataToUpdatePatch(data)
    CouponResolver.validateLockedFieldsAfterClaim(coupon, patch, hasBeenClaimed)

    const nextValidFrom = data.validFrom ?? coupon.validFrom
    const nextValidUntil = data.validUntil ?? coupon.validUntil
    if (nextValidFrom > nextValidUntil) {
      throw new ErrorWithStatus(400, CouponUpdateError.invalidDateRange)
    }

    CouponResolver.validateNumbers(coupon, patch)
    CouponResolver.validateLimitsAfterUsage(coupon, patch, hasBeenUsed)
    CouponResolver.validateAvailabilityAndPoints(coupon, patch)
    await this.validateRewardAccess(coupon, patch, ctx)

    const overrideRow = {
      ...data,
      ...(data.availability === AvailabilityType.FREE ? { pointsCost: null } : {}),
    }

    const mergedPreviewOverride: CouponStoreOverrideLike = {
      ...(existingOverride ?? {}),
      ...overrideRow,
    }
    const mergedPreview = mergePrismaCouponWithOverride(coupon, mergedPreviewOverride)
    assertCouponTypeSpecificShapeFromPrismaCoupon(mergedPreview)

    await ctx.prisma.couponStoreOverride.upsert({
      where: {
        UniqueCouponStoreOverride: {
          couponId,
          merchantStoreId: storeId,
        },
      },
      create: {
        couponId,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        ...overrideRow,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        ...overrideRow,
      },
    })

    const override = await ctx.prisma.couponStoreOverride.findUnique({
      where: {
        UniqueCouponStoreOverride: {
          couponId,
          merchantStoreId: storeId,
        },
      },
    })
    return this.applyCouponStoreOverride((coupon as unknown) as Coupon, override)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteCouponStoreOverride(
    @Arg('couponId') couponId: string,
    @Arg('storeId') storeId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const coupon = await ctx.prisma.coupon.findUnique({
      where: { id: couponId },
      select: { merchantId: true },
    })
    if (!coupon) {
      throw new ErrorWithStatus(404, 'Coupon not found')
    }
    await this.ensureStoreAccess(coupon.merchantId, storeId, ctx)
    await this.ensureCanEditCouponOverride(coupon.merchantId, ctx)
    await ctx.prisma.couponStoreOverride.deleteMany({
      where: { couponId, merchantStoreId: storeId },
    })
    return true
  }
}
