import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID } from 'type-graphql'
import { OperatorPermission, Prisma, RewardStoreOverride, UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import { Reward, RewardSourceType, RewardValueType } from '../objectType/Reward'
import { CreateRewardInput } from '../inputType/CreateRewardInput'
import { UpsertRewardStoreOverrideInput } from '../inputType/UpsertRewardStoreOverrideInput'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { UserRedeemableReward } from '../objectType/UserRedeemableReward'
import { ClaimedRewardStatus } from '../objectType/ClaimedRewardStatus'
import { AvailableRewardStatus } from '../objectType/AvailableRewardStatus'
import { UserRewardService } from '../service/UserRewardService'
import { UserRewardTransitionService } from '../service/UserRewardTransitionService'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'

@Resolver(() => Reward)
export class RewardResolver {
  private async ensureCanEditRewardBase(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }

    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditBase = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.REWARD_BASE_WRITE
    )
    if (!canEditBase) {
      throw new ErrorWithStatus(403, 'No access to edit merchant-wide configuration (full merchant scope required)')
    }
  }

  private async ensureCanEditRewardOverride(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditOverride = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.REWARD_OVERRIDE_WRITE
    )
    if (!canEditOverride) {
      throw new ErrorWithStatus(403, 'No access to edit reward store overrides')
    }
  }

  private async ensureStoreAccess(ctx: Context, merchantId: string, storeId: string): Promise<void> {
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

  private buildRewardStoreOverrideData(
    data: UpsertRewardStoreOverrideInput
  ): Omit<Prisma.RewardStoreOverrideUncheckedCreateInput, 'id' | 'rewardId' | 'merchantStoreId' | 'updatedByUserId'> {
    const result: Omit<
      Prisma.RewardStoreOverrideUncheckedCreateInput,
      'id' | 'rewardId' | 'merchantStoreId' | 'updatedByUserId'
    > = {}
    if (data.title !== undefined) result.title = data.title
    if (data.description !== undefined) result.description = data.description
    if (data.imageUrl !== undefined) result.imageUrl = data.imageUrl
    if (data.isActive !== undefined) result.isActive = data.isActive
    if (data.productName !== undefined) result.productName = data.productName
    if (data.maxUsesPerUser !== undefined) result.maxUsesPerUser = data.maxUsesPerUser
    if (data.totalQuantity !== undefined) result.totalQuantity = data.totalQuantity
    if (data.validFrom !== undefined) result.validFrom = data.validFrom
    if (data.validUntil !== undefined) result.validUntil = data.validUntil
    if (data.valueType !== undefined) {
      const vt = data.valueType
      result.valueType = data.valueType
      result.discountPercent = vt === RewardValueType.DISCOUNT_PERCENT ? data.discountPercent ?? null : null
      result.discountAmount = vt === RewardValueType.DISCOUNT_AMOUNT ? data.discountAmount ?? null : null
      result.pointsValue = vt === RewardValueType.POINTS ? data.pointsValue ?? null : null
    }
    return result
  }

  private static mergeRewardValueType(
    overrideValueType: RewardStoreOverride['valueType'],
    base: RewardValueType
  ): RewardValueType {
    const v = String(overrideValueType ?? base)
    switch (v) {
      case RewardValueType.FREE_SERVICE:
        return RewardValueType.FREE_SERVICE
      case RewardValueType.DISCOUNT_PERCENT:
        return RewardValueType.DISCOUNT_PERCENT
      case RewardValueType.DISCOUNT_AMOUNT:
        return RewardValueType.DISCOUNT_AMOUNT
      case RewardValueType.PRODUCT:
        return RewardValueType.PRODUCT
      case RewardValueType.POINTS:
        return RewardValueType.POINTS
      case RewardValueType.CASH_VOUCHER:
        return RewardValueType.CASH_VOUCHER
      default:
        return base
    }
  }

  private applyRewardStoreOverride(reward: Reward, override: RewardStoreOverride | null): Reward {
    if (!override) {
      return reward
    }
    return {
      ...reward,
      title: override.title ?? reward.title,
      description: override.description ?? reward.description,
      imageUrl: override.imageUrl ?? reward.imageUrl,
      isActive: override.isActive ?? reward.isActive,
      valueType: RewardResolver.mergeRewardValueType(override.valueType, reward.valueType),
      discountPercent: override.discountPercent != null ? override.discountPercent : reward.discountPercent,
      discountAmount: override.discountAmount != null ? override.discountAmount : reward.discountAmount,
      pointsValue: override.pointsValue != null ? override.pointsValue : reward.pointsValue,
      productName: override.productName ?? reward.productName,
      maxUsesPerUser: override.maxUsesPerUser != null ? override.maxUsesPerUser : reward.maxUsesPerUser,
      totalQuantity: override.totalQuantity != null ? override.totalQuantity : reward.totalQuantity,
      validFrom: override.validFrom ?? reward.validFrom,
      validUntil: override.validUntil ?? reward.validUntil,
    }
  }

  private attachRewardScopeMetadata(reward: Reward, activeOverrideStoreIds: string[]): Reward {
    const uniqueStoreIds = Array.from(new Set(activeOverrideStoreIds))
    const availableStoreIds = reward.isActive ? [] : uniqueStoreIds
    return {
      ...reward,
      availableStoreIds,
    }
  }

  private async resolveMerchantIdsForOperator(
    ctx: Context,
    requiredPermission?: OperatorPermission
  ): Promise<string[] | null> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return null
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    if (requiredPermission) {
      return merchantAccessService.resolveMerchantIdsByPermission(user.id, user.roles, requiredPermission)
    }
    const scopes = await merchantAccessService.resolveOperatorMerchantScopes(user.id, user.roles)
    return [...new Set(scopes.map((scope) => scope.merchantId))]
  }

  private async resolveTargetUserId(
    ctx: Context,
    userIdentifier: string | undefined,
    allowCrossUserAccess: boolean
  ): Promise<string> {
    const currentUser = ctx.req.user!
    if (!userIdentifier) {
      return currentUser.id
    }

    if (!allowCrossUserAccess && userIdentifier !== currentUser.id) {
      throw new ErrorWithStatus(403, 'No access to selected user')
    }

    const isEmail = userIdentifier.includes('@')
    const targetUser = await ctx.prisma.user.findFirst({
      where: isEmail ? { email: userIdentifier.toLowerCase().trim() } : { id: userIdentifier },
    })
    if (!targetUser) {
      throw new ErrorWithStatus(404, `User with ${isEmail ? 'email' : 'id'} ${userIdentifier} not found`)
    }
    if (!allowCrossUserAccess && targetUser.id !== currentUser.id) {
      throw new ErrorWithStatus(403, 'No access to selected user')
    }
    return targetUser.id
  }

  private mapClaimedReward(record: {
    id: string
    sourceType: UserRewardSourceType
    sourceEntityId: string
    sourceSubEntityId: string
    rewardId: string | null
    title: string
    description: string | null
    merchantId: string | null
    status: UserRewardStatus
    claimedAt: Date | null
    redeemedAt: Date | null
    createdAt: Date
  }): ClaimedRewardStatus {
    const source = record.sourceType
    const streakStageId = source === UserRewardSourceType.STREAK ? record.sourceSubEntityId.split(':')[0] : undefined
    const cardId =
      source === UserRewardSourceType.STAMP_MAIN || source === UserRewardSourceType.STAMP_MILESTONE
        ? record.sourceEntityId
        : undefined
    const milestoneId = source === UserRewardSourceType.STAMP_MILESTONE ? record.sourceSubEntityId : undefined

    return {
      id: record.id,
      source,
      rewardId: record.rewardId ?? undefined,
      streakProgramId: source === UserRewardSourceType.STREAK ? record.sourceEntityId : undefined,
      streakStageId,
      cardId,
      milestoneId,
      title: record.title,
      description: record.description ?? undefined,
      merchantId: record.merchantId ?? undefined,
      merchantName: undefined,
      claimedAt: record.claimedAt ?? record.createdAt,
      isRedeemed: record.status === UserRewardStatus.REDEEMED,
      redeemedAt: record.redeemedAt ?? undefined,
    }
  }

  private async mapClaimedRewardWithMerchant(
    ctx: Context,
    record: {
      id: string
      sourceType: UserRewardSourceType
      sourceEntityId: string
      sourceSubEntityId: string
      rewardId: string | null
      title: string
      description: string | null
      merchantId: string | null
      status: UserRewardStatus
      claimedAt: Date | null
      redeemedAt: Date | null
      createdAt: Date
    }
  ): Promise<ClaimedRewardStatus> {
    const merchantNameMap = await this.resolveMerchantNameMap(ctx, [record.merchantId])
    const mapped = this.mapClaimedReward(record)
    mapped.merchantName = record.merchantId ? merchantNameMap.get(record.merchantId) ?? '' : ''
    return mapped
  }

  private mapAvailableReward(record: {
    id: string
    sourceType: UserRewardSourceType
    sourceEntityId: string
    sourceSubEntityId: string
    rewardId: string | null
    title: string
    description: string | null
    merchantId: string | null
    payload: unknown
  }): AvailableRewardStatus {
    const source = record.sourceType
    const streakStageId = source === UserRewardSourceType.STREAK ? record.sourceSubEntityId.split(':')[0] : undefined
    let currentStreak: number | undefined
    let dayThreshold: number | undefined

    if (record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)) {
      const currentStreakValue = Reflect.get(record.payload, 'currentStreak')
      const dayThresholdValue = Reflect.get(record.payload, 'dayThreshold')
      if (typeof currentStreakValue === 'number') {
        currentStreak = currentStreakValue
      }
      if (typeof dayThresholdValue === 'number') {
        dayThreshold = dayThresholdValue
      }
    }

    return {
      id: record.id,
      source,
      rewardId: record.rewardId ?? undefined,
      cardId:
        source === UserRewardSourceType.STAMP_MAIN || source === UserRewardSourceType.STAMP_MILESTONE
          ? record.sourceEntityId
          : undefined,
      milestoneId: source === UserRewardSourceType.STAMP_MILESTONE ? record.sourceSubEntityId : undefined,
      streakProgramId: source === UserRewardSourceType.STREAK ? record.sourceEntityId : undefined,
      streakStageId,
      title: record.title,
      description: record.description ?? undefined,
      merchantId: record.merchantId ?? undefined,
      merchantName: undefined,
      currentStreak,
      dayThreshold,
      canClaim: true,
    }
  }

  private async resolveMerchantNameMap(ctx: Context, merchantIds: Array<string | null>): Promise<Map<string, string>> {
    const ids = merchantIds.filter((id): id is string => Boolean(id))
    if (ids.length < 1) {
      return new Map<string, string>()
    }
    const merchants = await ctx.prisma.merchant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
    return new Map<string, string>(merchants.map((merchant) => [merchant.id, merchant.name]))
  }

  private async ensureOperatorAccessToMerchant(ctx: Context, merchantId: string | null | undefined): Promise<void> {
    if (!merchantId) {
      return
    }

    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'No access to this merchant')
    }
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [Reward])
  async myRewards(
    @Ctx() ctx: Context,
    @Arg('storeId', () => ID, { nullable: true }) storeId?: string
  ): Promise<Reward[]> {
    const user = ctx.req.user!
    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store) {
        throw new ErrorWithStatus(404, 'Store not found')
      }
      await this.ensureStoreAccess(ctx, store.merchantId, storeId)
      const baseRewards = (await ctx.prisma.reward.findMany({
        where: { merchantId: store.merchantId },
        include: { merchant: true },
      })) as Reward[]
      const overrides = await ctx.prisma.rewardStoreOverride.findMany({
        where: {
          merchantStoreId: storeId,
          rewardId: { in: baseRewards.map((reward) => reward.id) },
        },
      })
      const overrideByRewardId = new Map(overrides.map((item) => [item.rewardId, item]))
      return baseRewards
        .map((reward) =>
          this.attachRewardScopeMetadata(
            this.applyRewardStoreOverride(reward, overrideByRewardId.get(reward.id) ?? null),
            [storeId]
          )
        )
        .filter((reward) => reward.isActive)
    }

    if (user.roles.includes(Role.ADMIN)) {
      const rewards = (await ctx.prisma.reward.findMany({
        include: { merchant: true },
      })) as Reward[]
      const overrides = await ctx.prisma.rewardStoreOverride.findMany({
        where: { rewardId: { in: rewards.map((reward) => reward.id) }, isActive: true },
        select: { rewardId: true, merchantStoreId: true },
      })
      const overrideStoreIdsByRewardId = new Map<string, string[]>()
      for (const item of overrides) {
        const currentStoreIds = overrideStoreIdsByRewardId.get(item.rewardId) ?? []
        currentStoreIds.push(item.merchantStoreId)
        overrideStoreIdsByRewardId.set(item.rewardId, currentStoreIds)
      }
      return rewards
        .map((reward) => this.attachRewardScopeMetadata(reward, overrideStoreIdsByRewardId.get(reward.id) ?? []))
        .filter((reward) => reward.isActive || (reward.availableStoreIds ?? []).length > 0)
    }
    const merchantIds = (await this.resolveMerchantIdsForOperator(ctx, OperatorPermission.REWARD_READ)) || []

    const rewards = (await ctx.prisma.reward.findMany({
      where: { merchantId: { in: merchantIds } },
      include: { merchant: true },
    })) as Reward[]
    const overrides = await ctx.prisma.rewardStoreOverride.findMany({
      where: { rewardId: { in: rewards.map((reward) => reward.id) }, isActive: true },
      select: { rewardId: true, merchantStoreId: true },
    })
    const overrideStoreIdsByRewardId = new Map<string, string[]>()
    for (const item of overrides) {
      const currentStoreIds = overrideStoreIdsByRewardId.get(item.rewardId) ?? []
      currentStoreIds.push(item.merchantStoreId)
      overrideStoreIdsByRewardId.set(item.rewardId, currentStoreIds)
    }
    return rewards
      .map((reward) => this.attachRewardScopeMetadata(reward, overrideStoreIdsByRewardId.get(reward.id) ?? []))
      .filter((reward) => reward.isActive || (reward.availableStoreIds ?? []).length > 0)
  }

  @Query(() => [Reward])
  async availableRewards(
    @Ctx() ctx: Context,
    @Arg('merchantId', () => ID, { nullable: true }) merchantId?: string,
    @Arg('sourceType', () => RewardSourceType, { nullable: true }) sourceType?: RewardSourceType,
    @Arg('storeId', () => ID, { nullable: true }) storeId?: string
  ): Promise<Reward[]> {
    const where: any = { isActive: true }
    if (merchantId) where.merchantId = merchantId
    if (sourceType) where.sourceType = sourceType

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
      where.merchantId = store.merchantId
      delete where.isActive
    }

    const baseRewards = (await ctx.prisma.reward.findMany({
      where,
      include: { merchant: true },
    })) as Reward[]

    if (!storeId) {
      return baseRewards
    }

    const overrides = await ctx.prisma.rewardStoreOverride.findMany({
      where: {
        merchantStoreId: storeId,
        rewardId: { in: baseRewards.map((reward) => reward.id) },
      },
    })
    const overrideByRewardId = new Map(overrides.map((item) => [item.rewardId, item]))
    return baseRewards
      .map((reward) => this.applyRewardStoreOverride(reward, overrideByRewardId.get(reward.id) ?? null))
      .filter((reward) => reward.isActive)
  }

  @Query(() => Reward, { nullable: true })
  async reward(@Arg('id', () => ID) id: string, @Ctx() ctx: Context): Promise<Reward | null> {
    return (await ctx.prisma.reward.findUnique({
      where: { id },
      include: { merchant: true },
    })) as Reward | null
  }

  @Authorized([Role.CLIENT])
  @Query(() => [UserRedeemableReward])
  async myRedeemableRewards(@Ctx() ctx: Context): Promise<UserRedeemableReward[]> {
    const userId = ctx.req.user!.id
    const rewards: UserRedeemableReward[] = []

    // 1. Get all user's stamp cards with milestones
    const stampCards = await ctx.prisma.loyaltyStampCard.findMany({
      where: { userId, isActive: true },
      include: {
        merchant: true,
        template: { include: { milestones: true } },
        claimedMilestones: true,
      },
    })

    for (const card of stampCards) {
      // Add completed stamp cards (10/10)
      if (card.stampsCollected >= card.stampsRequired && card.stampsUsed === 0) {
        rewards.push({
          id: card.id,
          type: 'STAMP_CARD',
          title: card.template?.title || 'Stamp Card Reward',
          description: card.template?.rewardDescription || undefined,
          imageUrl: card.template?.stampCoverUrl || undefined,
          stampCoverUrl: card.template?.stampCoverUrl || undefined,
          stampStickerIconUrl: card.template?.stampStickerIconUrl || undefined,
          stampsCollected: card.stampsCollected,
          stampsRequired: card.stampsRequired,
          stampsNeeded: 0,
          canRedeem: true,
          merchant: card.merchant as any,
        })
      }

      // Add available milestones (e.g., 5/10 stamps = 20% discount)
      if (card.template?.milestones) {
        for (const milestone of card.template.milestones) {
          const alreadyClaimed = card.claimedMilestones.some((cm) => cm.milestoneId === milestone.id)
          if (!alreadyClaimed && card.stampsCollected >= milestone.stampsRequired && milestone.isActive) {
            rewards.push({
              id: milestone.id,
              type: 'MILESTONE',
              title: milestone.title || 'Milestone Reward',
              description: milestone.description || undefined,
              imageUrl: milestone.imageUrl || undefined,
              stampCoverUrl: card.template?.stampCoverUrl || undefined,
              stampStickerIconUrl: card.template?.stampStickerIconUrl || undefined,
              stampsCollected: card.stampsCollected,
              stampsRequired: milestone.stampsRequired,
              stampsNeeded: 0,
              canRedeem: true,
              merchant: card.merchant as any,
            })
          }
        }
      }
    }

    // 2. Get user's point balances per merchant
    const pointBalances = await ctx.prisma.userMerchantPointBalance.findMany({
      where: { userId },
      include: { merchant: true },
    })

    for (const balance of pointBalances) {
      const pointThreshold = balance.merchant.rewardProximityThreshold || 50

      // Get vouchers user can afford or is close to affording
      const vouchers = await ctx.prisma.merchantVoucher.findMany({
        where: {
          merchantId: balance.merchantId,
          isActive: true,
          pointsCost: { lte: balance.availablePoints + pointThreshold },
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
        include: { store: true },
      })

      for (const voucher of vouchers) {
        const pointsNeeded = Math.max(0, voucher.pointsCost - balance.availablePoints)
        rewards.push({
          id: voucher.id,
          type: 'VOUCHER',
          title: voucher.title,
          description: voucher.description || undefined,
          imageUrl: voucher.imageUrl || undefined,
          pointsCost: voucher.pointsCost,
          userPoints: balance.availablePoints,
          pointsNeeded,
          canRedeem: pointsNeeded === 0,
          merchant: balance.merchant as any,
          store: voucher.store as any,
        })
      }

      // Get coupons user can afford or is close to affording
      const coupons = await ctx.prisma.coupon.findMany({
        where: {
          merchantId: balance.merchantId,
          isActive: true,
          pointsCost: { not: null, lte: balance.availablePoints + pointThreshold },
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      })

      for (const coupon of coupons) {
        const pointsNeeded = Math.max(0, coupon.pointsCost! - balance.availablePoints)
        rewards.push({
          id: coupon.id,
          type: 'COUPON',
          title: coupon.title,
          description: coupon.description || undefined,
          pointsCost: coupon.pointsCost!,
          userPoints: balance.availablePoints,
          pointsNeeded,
          canRedeem: pointsNeeded === 0,
          merchant: balance.merchant as any,
        })
      }
    }

    // Sort: redeemable first, then by points/stamps needed
    return rewards.sort((a, b) => {
      if (a.canRedeem && !b.canRedeem) return -1
      if (!a.canRedeem && b.canRedeem) return 1
      return (a.pointsNeeded || a.stampsNeeded || 0) - (b.pointsNeeded || b.stampsNeeded || 0)
    })
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [AvailableRewardStatus])
  async myAvailableRewards(@Ctx() ctx: Context): Promise<AvailableRewardStatus[]> {
    const userId = ctx.req.user!.id
    const userRewardService = new UserRewardService(ctx.prisma)
    await userRewardService.refreshAvailableRewardsForUser(userId)

    const rows = await ctx.prisma.userReward.findMany({
      where: {
        userId,
        status: UserRewardStatus.AVAILABLE,
      },
      orderBy: { createdAt: 'desc' },
    })

    const merchantNameMap = await this.resolveMerchantNameMap(
      ctx,
      rows.map((row) => row.merchantId)
    )
    return rows.map((row) => {
      const mapped = this.mapAvailableReward(row)
      mapped.merchantName = row.merchantId ? merchantNameMap.get(row.merchantId) ?? '' : ''
      return mapped
    })
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [ClaimedRewardStatus])
  async myClaimedRewards(@Ctx() ctx: Context): Promise<ClaimedRewardStatus[]> {
    const userId = ctx.req.user!.id
    const rows = await ctx.prisma.userReward.findMany({
      where: {
        userId,
        status: { in: [UserRewardStatus.CLAIMED, UserRewardStatus.REDEEMED] },
      },
      orderBy: { claimedAt: 'desc' },
    })

    const merchantNameMap = await this.resolveMerchantNameMap(
      ctx,
      rows.map((row) => row.merchantId)
    )
    return rows.map((row) => {
      const mapped = this.mapClaimedReward(row)
      mapped.merchantName = row.merchantId ? merchantNameMap.get(row.merchantId) ?? '' : ''
      return mapped
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [AvailableRewardStatus])
  async getAvailableRewards(
    @Arg('userId', () => String) userId: string,
    @Ctx() ctx: Context
  ): Promise<AvailableRewardStatus[]> {
    const targetUserId = await this.resolveTargetUserId(ctx, userId, true)
    const merchantIds = await this.resolveMerchantIdsForOperator(ctx, OperatorPermission.REWARD_READ)
    if (merchantIds && merchantIds.length === 0) {
      return []
    }

    const userRewardService = new UserRewardService(ctx.prisma)
    await userRewardService.refreshAvailableRewardsForUser(targetUserId, merchantIds ?? undefined)

    const rows = await ctx.prisma.userReward.findMany({
      where: {
        userId: targetUserId,
        status: UserRewardStatus.AVAILABLE,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    const merchantNameMap = await this.resolveMerchantNameMap(
      ctx,
      rows.map((row) => row.merchantId)
    )
    return rows.map((row) => {
      const mapped = this.mapAvailableReward(row)
      mapped.merchantName = row.merchantId ? merchantNameMap.get(row.merchantId) ?? '' : ''
      return mapped
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [ClaimedRewardStatus])
  async getUserClaimedRewards(
    @Arg('userId', () => String) userId: string,
    @Ctx() ctx: Context
  ): Promise<ClaimedRewardStatus[]> {
    const targetUserId = await this.resolveTargetUserId(ctx, userId, true)
    const merchantIds = await this.resolveMerchantIdsForOperator(ctx, OperatorPermission.REWARD_READ)
    if (merchantIds && merchantIds.length === 0) {
      return []
    }

    const rows = await ctx.prisma.userReward.findMany({
      where: {
        userId: targetUserId,
        status: { in: [UserRewardStatus.CLAIMED, UserRewardStatus.REDEEMED] },
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      orderBy: { claimedAt: 'desc' },
    })

    const merchantNameMap = await this.resolveMerchantNameMap(
      ctx,
      rows.map((row) => row.merchantId)
    )
    return rows.map((row) => {
      const mapped = this.mapClaimedReward(row)
      mapped.merchantName = row.merchantId ? merchantNameMap.get(row.merchantId) ?? '' : ''
      return mapped
    })
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean)
  async backfillUserRewards(
    @Arg('userId', () => String, { nullable: true }) userId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const userRewardService = new UserRewardService(ctx.prisma)

    if (userId) {
      const targetUserId = await this.resolveTargetUserId(ctx, userId, true)
      await userRewardService.backfillForUser(targetUserId)
      return true
    }

    const users = await ctx.prisma.user.findMany({
      select: { id: true },
    })

    for (const user of users) {
      await userRewardService.backfillForUser(user.id)
    }

    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => ClaimedRewardStatus)
  async claimUserReward(
    @Arg('userRewardId', () => String) userRewardId: string,
    @Arg('storeId', () => ID, { nullable: true }) storeId: string | null | undefined,
    @Ctx() ctx: Context
  ): Promise<ClaimedRewardStatus> {
    const claimService = new UserRewardTransitionService(ctx.prisma)
    const claimStoreId = storeId ?? undefined
    const claimedUserReward = await claimService.claimUserReward({
      userRewardId,
      actorId: ctx.req.user!.id,
      actorRoles: ctx.req.user!.roles,
      ...(claimStoreId ? { storeId: claimStoreId } : {}),
    })
    return this.mapClaimedRewardWithMerchant(ctx, claimedUserReward)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => ClaimedRewardStatus)
  async redeemUserReward(
    @Arg('userRewardId', () => String) userRewardId: string,
    @Arg('storeId', () => ID) storeId: string,
    @Ctx() ctx: Context
  ): Promise<ClaimedRewardStatus> {
    const claimService = new UserRewardTransitionService(ctx.prisma)
    const redeemedUserReward = await claimService.redeemUserReward({
      userRewardId,
      actorId: ctx.req.user!.id,
      actorRoles: ctx.req.user!.roles,
      storeId,
    })
    return this.mapClaimedRewardWithMerchant(ctx, redeemedUserReward)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Reward)
  async createReward(
    @Arg('data') data: CreateRewardInput,
    @Arg('storeId', () => ID, { nullable: true }) storeId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<Reward> {
    const user = ctx.req.user!
    let merchantId = data.merchantId

    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store) {
        throw new ErrorWithStatus(404, 'Store not found')
      }
      merchantId = store.merchantId
      await this.ensureStoreAccess(ctx, merchantId, storeId)
      await this.ensureCanEditRewardOverride(ctx, merchantId)
    }

    if (!merchantId && !user.roles.includes(Role.ADMIN)) {
      const merchantAccessService = new MerchantAccessService(ctx.prisma)
      merchantId = (await merchantAccessService.resolvePrimaryMerchantId(user.id, user.roles)) ?? undefined
    }
    if (!merchantId && !user.roles.includes(Role.ADMIN)) {
      throw new ErrorWithStatus(400, 'merchantId is required')
    }

    if (merchantId && !user.roles.includes(Role.ADMIN) && !storeId) {
      const merchantAccessService = new MerchantAccessService(ctx.prisma)
      const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
      if (!hasAccess) throw new ErrorWithStatus(403, 'No access to this merchant')
      await this.ensureCanEditRewardBase(ctx, merchantId)
    }

    const createdReward = (await ctx.prisma.reward.create({
      data: { ...data, merchantId, isActive: storeId ? false : true },
      include: { merchant: true },
    })) as Reward

    if (!storeId) {
      return createdReward
    }

    const override = await ctx.prisma.rewardStoreOverride.upsert({
      where: {
        UniqueRewardStoreOverride: {
          rewardId: createdReward.id,
          merchantStoreId: storeId,
        },
      },
      create: {
        rewardId: createdReward.id,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        isActive: true,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        isActive: true,
      },
    })

    return this.attachRewardScopeMetadata(this.applyRewardStoreOverride(createdReward, override), [storeId])
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Reward)
  async updateReward(
    @Arg('id', () => ID) id: string,
    @Arg('data') data: CreateRewardInput,
    @Ctx() ctx: Context
  ): Promise<Reward> {
    const reward = await ctx.prisma.reward.findUnique({ where: { id } })
    if (!reward) throw new ErrorWithStatus(404, 'Reward not found')

    const user = ctx.req.user!
    if (reward.merchantId && !user.roles.includes(Role.ADMIN)) {
      const merchantAccessService = new MerchantAccessService(ctx.prisma)
      const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, reward.merchantId)
      if (!hasAccess) throw new ErrorWithStatus(403, 'No access to this reward')
      await this.ensureCanEditRewardBase(ctx, reward.merchantId)
    }

    return (await ctx.prisma.reward.update({
      where: { id },
      data,
      include: { merchant: true },
    })) as Reward
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteReward(@Arg('id', () => ID) id: string, @Ctx() ctx: Context): Promise<boolean> {
    const reward = await ctx.prisma.reward.findUnique({
      where: { id },
      include: { stampTemplates: true, stampMilestones: true, coupons: true },
    })

    if (!reward) throw new ErrorWithStatus(404, 'Reward not found')

    if (reward.stampTemplates.length > 0 || reward.stampMilestones.length > 0 || reward.coupons.length > 0) {
      throw new ErrorWithStatus(409, 'Cannot delete reward that is in use')
    }

    const user = ctx.req.user!
    if (reward.merchantId && !user.roles.includes(Role.ADMIN)) {
      const merchantAccessService = new MerchantAccessService(ctx.prisma)
      const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, reward.merchantId)
      if (!hasAccess) throw new ErrorWithStatus(403, 'No access to this reward')
      await this.ensureCanEditRewardBase(ctx, reward.merchantId)
    }

    await ctx.prisma.reward.delete({ where: { id } })
    return true
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Reward)
  async upsertRewardStoreOverride(
    @Arg('rewardId', () => ID) rewardId: string,
    @Arg('storeId', () => ID) storeId: string,
    @Arg('data') data: UpsertRewardStoreOverrideInput,
    @Ctx() ctx: Context
  ): Promise<Reward> {
    const reward = await ctx.prisma.reward.findUnique({
      where: { id: rewardId },
      include: { merchant: true },
    })
    if (!reward || !reward.merchantId) {
      throw new ErrorWithStatus(404, 'Reward not found')
    }
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true },
    })
    if (!store || store.merchantId !== reward.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to reward merchant')
    }

    await this.ensureStoreAccess(ctx, reward.merchantId, storeId)
    await this.ensureCanEditRewardOverride(ctx, reward.merchantId)

    const overrideData = this.buildRewardStoreOverrideData(data)
    await ctx.prisma.rewardStoreOverride.upsert({
      where: {
        UniqueRewardStoreOverride: {
          rewardId,
          merchantStoreId: storeId,
        },
      },
      create: {
        rewardId,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        ...overrideData,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        ...overrideData,
      },
    })

    const override = await ctx.prisma.rewardStoreOverride.findUnique({
      where: {
        UniqueRewardStoreOverride: {
          rewardId,
          merchantStoreId: storeId,
        },
      },
    })
    return this.applyRewardStoreOverride(reward as Reward, override)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteRewardStoreOverride(
    @Arg('rewardId', () => ID) rewardId: string,
    @Arg('storeId', () => ID) storeId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const reward = await ctx.prisma.reward.findUnique({
      where: { id: rewardId },
      select: { merchantId: true },
    })
    if (!reward?.merchantId) {
      throw new ErrorWithStatus(404, 'Reward not found')
    }
    await this.ensureStoreAccess(ctx, reward.merchantId, storeId)
    await this.ensureCanEditRewardOverride(ctx, reward.merchantId)
    await ctx.prisma.rewardStoreOverride.deleteMany({
      where: { rewardId, merchantStoreId: storeId },
    })
    return true
  }
}
