import { OperatorPermission, Prisma, User as PrismaUser, UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Context } from '../../shared/interface/Context'
import { CreateStreakProgramInput } from '../inputType/CreateStreakProgramInput'
import { RegisterStreakVisitInput } from '../inputType/RegisterStreakVisitInput'
import { UpdateStreakProgramInput } from '../inputType/UpdateStreakProgramInput'
import { UpsertStreakProgramStoreOverrideInput } from '../inputType/UpsertStreakProgramStoreOverrideInput'
import { StreakBenefitType } from '../objectType/StreakBenefitType'
import { StreakingPolicy } from '../objectType/StreakingPolicy'
import { StreakProgram, StreakRewardClaim, UserStreakStatus } from '../objectType/StreakProgram'
import {
  countAchievedRewards,
  resolveDateInTimezone,
  resolveNextClaimableStage,
  resolvePeriodDifference,
  StageSnapshot,
  StreakBenefitTypeValue,
} from '../service/StreakDomain'
import { StreakValidationService } from '../service/StreakValidationService'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'

type RequestUser = {
  id: string
  roles: string[]
}

@Resolver(() => StreakProgram)
export class StreakResolver {
  private streakValidationService = new StreakValidationService()
  private readonly streakProgramInclude: Prisma.StreakProgramInclude = {
    merchant: true,
    reward: true,
    stages: {
      include: { reward: true },
      orderBy: { dayThreshold: 'asc' as const },
    },
  }

  private resolveRequiredConsecutiveDays(stages: StageSnapshot[]): number {
    return stages[stages.length - 1]?.dayThreshold ?? 0
  }

  private resolveEffectiveStages(program: {
    id: string
    requiredConsecutiveDays: number
    rewardId?: string | null
    stages?: Array<{
      id: string
      dayThreshold: number
      benefitType: StreakBenefitTypeValue
      rewardId?: string | null
      infoMessage?: string | null
      pointsMultiplier?: number | null
      pointsAmount?: number | null
    }>
  }): StageSnapshot[] {
    if (program.stages && program.stages.length > 0) {
      return [...program.stages]
        .map((stage) => ({
          id: stage.id,
          dayThreshold: stage.dayThreshold,
          benefitType: stage.benefitType,
          rewardId: stage.rewardId ?? undefined,
          infoMessage: stage.infoMessage ?? undefined,
          pointsMultiplier: stage.pointsMultiplier ?? undefined,
          pointsAmount: stage.pointsAmount ?? undefined,
        }))
        .sort((a, b) => a.dayThreshold - b.dayThreshold)
    }

    if (program.requiredConsecutiveDays > 0) {
      return [
        {
          dayThreshold: program.requiredConsecutiveDays,
          benefitType: program.rewardId ? StreakBenefitType.REWARD : StreakBenefitType.INFO_ONLY,
          rewardId: program.rewardId ?? undefined,
          infoMessage: program.rewardId ? undefined : 'Streak completed',
        },
      ]
    }

    return []
  }

  private resolveRemainingDaysToReward(currentStreak: number, stages: StageSnapshot[], repeatable: boolean): number {
    if (stages.length < 1) {
      return 0
    }

    if (!repeatable) {
      const nextStage = stages.find((stage) => stage.dayThreshold > currentStreak)
      return nextStage ? nextStage.dayThreshold - currentStreak : 0
    }

    const cycleLength = stages[stages.length - 1].dayThreshold
    if (cycleLength < 1) {
      return 0
    }

    const cycleProgress = currentStreak % cycleLength
    if (cycleProgress === 0) {
      return stages[0].dayThreshold
    }

    const nextStageInCycle = stages.find((stage) => stage.dayThreshold > cycleProgress)
    if (nextStageInCycle) {
      return nextStageInCycle.dayThreshold - cycleProgress
    }

    return cycleLength - cycleProgress + stages[0].dayThreshold
  }

  private async resolveAccessibleMerchantIdsForUser(
    ctx: Context,
    user: RequestUser,
    requiredPermission?: OperatorPermission
  ): Promise<string[]> {
    if (user.roles.includes(Role.ADMIN)) {
      return []
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    if (requiredPermission) {
      return merchantAccessService.resolveMerchantIdsByPermission(user.id, user.roles, requiredPermission)
    }
    const scopes = await merchantAccessService.resolveOperatorMerchantScopes(user.id, user.roles)
    return [...new Set(scopes.map((scope) => scope.merchantId))]
  }

  private canManageMerchantResources(roles: string[]): boolean {
    return roles.includes(Role.ADMIN) || roles.includes(Role.OWNER) || roles.includes(Role.COOPERATOR)
  }

  private async resolveMerchantIdsForUser(ctx: Context, requiredPermission?: OperatorPermission): Promise<string[]> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }
    return this.resolveAccessibleMerchantIdsForUser(ctx, user, requiredPermission)
  }

  private async resolvePrimaryMerchantIdForUser(ctx: Context): Promise<string | null> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    return merchantAccessService.resolvePrimaryMerchantId(user.id, user.roles)
  }

  private async ensureMerchantAccess(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'No access to this merchant')
    }
  }

  private async ensureCanEditStreakBase(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditBase = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.STREAK_BASE_WRITE
    )
    if (!canEditBase) {
      throw new ErrorWithStatus(403, 'No access to edit merchant-wide configuration (full merchant scope required)')
    }
  }

  private async ensureCanEditStreakOverride(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditOverride = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.STREAK_OVERRIDE_WRITE
    )
    if (!canEditOverride) {
      throw new ErrorWithStatus(403, 'No access to edit streak store overrides')
    }
  }

  private async ensureStoreAccess(ctx: Context, merchantId: string, storeId: string): Promise<void> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasStoreAccess = await merchantAccessService.ensureStoreAccess(user.id, user.roles, merchantId, storeId)
    if (!hasStoreAccess) {
      throw new ErrorWithStatus(403, 'No access to this store')
    }
  }

  private applyStreakStoreOverride(
    program: StreakProgram,
    override: {
      name: string | null
      description: string | null
      requiredConsecutiveDays: number | null
      streakingInterval: number | null
      graceDays: number | null
      timezone: string | null
      repeatable: boolean | null
      isActive: boolean | null
    } | null
  ): StreakProgram {
    if (!override) {
      return program
    }
    return {
      ...program,
      name: override.name ?? program.name,
      description: override.description ?? program.description,
      requiredConsecutiveDays: override.requiredConsecutiveDays ?? program.requiredConsecutiveDays,
      streakingInterval: override.streakingInterval ?? program.streakingInterval,
      graceDays: override.graceDays ?? program.graceDays,
      timezone: override.timezone ?? program.timezone,
      repeatable: override.repeatable ?? program.repeatable,
      isActive: override.isActive ?? program.isActive,
    }
  }

  private attachStreakScopeMetadata(program: StreakProgram, activeOverrideStoreIds: string[]): StreakProgram {
    const uniqueStoreIds = Array.from(new Set(activeOverrideStoreIds))
    const availableStoreIds = program.isActive ? [] : uniqueStoreIds
    return {
      ...program,
      availableStoreIds,
    }
  }

  private buildStatus(
    program: StreakProgram,
    stages: StageSnapshot[],
    state: {
      currentStreak: number
      longestStreak: number
      claimableRewardsCount: number
      claimedCycles: number
      lastVisitLocalDate: Date | null
    } | null
  ): UserStreakStatus {
    const currentStreak = state?.currentStreak ?? 0
    const longestStreak = state?.longestStreak ?? 0
    const claimableRewardsCount = state?.claimableRewardsCount ?? 0
    const claimedCycles = state?.claimedCycles ?? 0
    const requiredConsecutiveDays = this.resolveRequiredConsecutiveDays(stages)
    const remainingDaysToReward = this.resolveRemainingDaysToReward(currentStreak, stages, program.repeatable)

    return {
      streakProgram: program,
      currentStreak,
      longestStreak,
      claimableRewardsCount,
      claimedCycles,
      requiredConsecutiveDays,
      remainingDaysToReward,
      lastVisitLocalDate: state?.lastVisitLocalDate ?? undefined,
    }
  }

  private async resolveTargetUser(ctx: Context, userIdentifier?: string): Promise<PrismaUser> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const canActOnAnotherUser = this.canManageMerchantResources(currentUser.roles)

    if (!userIdentifier) {
      const user = await ctx.prisma.user.findUnique({
        where: { id: currentUser.id },
      })
      if (!user) {
        throw new ErrorWithStatus(404, 'Current user not found')
      }
      return user
    }

    if (!canActOnAnotherUser && userIdentifier !== currentUser.id) {
      throw new ErrorWithStatus(403, 'No access to selected user')
    }

    const isEmailIdentifier = userIdentifier.includes('@')
    const user = await ctx.prisma.user.findFirst({
      where: isEmailIdentifier ? { email: userIdentifier.toLowerCase().trim() } : { id: userIdentifier },
    })

    if (!user) {
      throw new ErrorWithStatus(404, 'Target user not found')
    }

    if (!canActOnAnotherUser && user.id !== currentUser.id) {
      throw new ErrorWithStatus(403, 'No access to selected user')
    }

    return user
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [StreakProgram])
  async myMerchantStreaks(
    @Ctx() ctx: Context,
    @Arg('storeId', () => String, { nullable: true }) storeId?: string
  ): Promise<StreakProgram[]> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    let where: { deletedAt: null; merchantId?: string | { in: string[] } } = { deletedAt: null }
    if (storeId) {
      const store = await ctx.prisma.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store) {
        throw new ErrorWithStatus(404, 'Store not found')
      }
      if (!user.roles.includes(Role.ADMIN)) {
        await this.ensureStoreAccess(ctx, store.merchantId, storeId)
      }
      where = { deletedAt: null, merchantId: store.merchantId }
    } else if (!user.roles.includes(Role.ADMIN)) {
      where = {
        deletedAt: null,
        merchantId: { in: await this.resolveMerchantIdsForUser(ctx, OperatorPermission.STREAK_READ) },
      }
    }

    const programs = ((await ctx.prisma.streakProgram.findMany({
      where,
      include: this.streakProgramInclude,
      orderBy: { createdAt: 'desc' },
    })) as unknown) as StreakProgram[]

    if (!storeId) {
      const overrides = await ctx.prisma.streakProgramStoreOverride.findMany({
        where: {
          streakProgramId: { in: programs.map((program) => program.id) },
          isActive: true,
        },
        select: { streakProgramId: true, merchantStoreId: true },
      })
      const overrideStoreIdsByProgramId = new Map<string, string[]>()
      for (const item of overrides) {
        const currentStoreIds = overrideStoreIdsByProgramId.get(item.streakProgramId) ?? []
        currentStoreIds.push(item.merchantStoreId)
        overrideStoreIdsByProgramId.set(item.streakProgramId, currentStoreIds)
      }
      return programs
        .map((program) => this.attachStreakScopeMetadata(program, overrideStoreIdsByProgramId.get(program.id) ?? []))
        .filter((program) => program.isActive || (program.availableStoreIds ?? []).length > 0)
    }

    const overrides = await ctx.prisma.streakProgramStoreOverride.findMany({
      where: {
        merchantStoreId: storeId,
        streakProgramId: { in: programs.map((program) => program.id) },
      },
    })
    const overrideByProgramId = new Map(overrides.map((item) => [item.streakProgramId, item]))
    return programs
      .map((program) =>
        this.attachStreakScopeMetadata(
          this.applyStreakStoreOverride(program, overrideByProgramId.get(program.id) ?? null),
          [storeId]
        )
      )
      .filter((program) => program.isActive)
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [UserStreakStatus])
  async myStreaks(@Ctx() ctx: Context): Promise<UserStreakStatus[]> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const programs = await ctx.prisma.streakProgram.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ states: { some: { userId: currentUser.id } } }, { visits: { some: { userId: currentUser.id } } }],
      },
      include: {
        ...this.streakProgramInclude,
        states: {
          where: { userId: currentUser.id },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return programs.map((program) => {
      const effectiveStages = this.resolveEffectiveStages(program)
      const state = program.states[0] ?? null
      return this.buildStatus((program as unknown) as StreakProgram, effectiveStages, state)
    })
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => UserStreakStatus)
  async myStreakStatus(
    @Arg('streakProgramId') streakProgramId: string,
    @Ctx() ctx: Context
  ): Promise<UserStreakStatus> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      include: this.streakProgramInclude,
    })
    if (!program) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }
    if (program.deletedAt) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }

    const state = await ctx.prisma.userStreakState.findUnique({
      where: {
        UniqueUserStreakState: {
          userId: currentUser.id,
          streakProgramId,
        },
      },
    })

    const effectiveStages = this.resolveEffectiveStages(program)
    return this.buildStatus((program as unknown) as StreakProgram, effectiveStages, state)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => StreakProgram)
  async createStreakProgram(
    @Arg('data') data: CreateStreakProgramInput,
    @Arg('storeId', () => String, { nullable: true }) storeId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<StreakProgram> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    this.streakValidationService.validateStreakProgramInput({
      graceDays: data.graceDays,
      streakingInterval: data.streakingInterval,
    })

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
      await this.ensureCanEditStreakOverride(ctx, merchantId)
    } else if (!merchantId && !currentUser.roles.includes(Role.ADMIN)) {
      merchantId = (await this.resolvePrimaryMerchantIdForUser(ctx)) ?? undefined
    }
    if (!merchantId) {
      throw new ErrorWithStatus(400, 'merchantId is required')
    }

    await this.ensureMerchantAccess(ctx, merchantId)
    if (!storeId) {
      await this.ensureCanEditStreakBase(ctx, merchantId)
    }
    const stages = this.streakValidationService.normalizeStages(data.stages)
    await this.streakValidationService.validateStageRewards({ prisma: ctx.prisma, merchantId, stages })
    await this.streakValidationService.validatePointsBenefitsAvailability({ prisma: ctx.prisma, merchantId, stages })
    const requiredConsecutiveDays = this.resolveRequiredConsecutiveDays(stages)
    const finalRewardId = stages[stages.length - 1]?.rewardId

    const createdProgram = ((await ctx.prisma.streakProgram.create({
      data: {
        merchantId,
        rewardId: finalRewardId,
        name: data.name,
        description: data.description,
        requiredConsecutiveDays,
        streakingPolicy: data.streakingPolicy,
        streakingInterval: data.streakingInterval,
        timezone: data.timezone,
        graceDays: data.graceDays,
        repeatable: data.repeatable,
        isActive: storeId ? false : data.isActive,
        stages: {
          create: stages.map((stage) => ({
            dayThreshold: stage.dayThreshold,
            benefitType: stage.benefitType,
            rewardId: stage.rewardId,
            infoMessage: stage.infoMessage,
            pointsMultiplier: stage.pointsMultiplier,
            pointsAmount: stage.pointsAmount,
          })),
        },
      },
      include: this.streakProgramInclude,
    })) as unknown) as StreakProgram

    if (!storeId) {
      return this.attachStreakScopeMetadata(createdProgram, [])
    }

    const override = await ctx.prisma.streakProgramStoreOverride.upsert({
      where: {
        UniqueStreakProgramStoreOverride: {
          streakProgramId: createdProgram.id,
          merchantStoreId: storeId,
        },
      },
      create: {
        streakProgramId: createdProgram.id,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        isActive: data.isActive,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        isActive: data.isActive,
      },
    })

    return this.attachStreakScopeMetadata(this.applyStreakStoreOverride(createdProgram, override), [storeId])
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => StreakProgram)
  async updateStreakProgram(
    @Arg('streakProgramId') streakProgramId: string,
    @Arg('data') data: UpdateStreakProgramInput,
    @Ctx() ctx: Context
  ): Promise<StreakProgram> {
    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      include: { stages: { orderBy: { dayThreshold: 'asc' } } },
    })
    if (!program) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }
    if (program.deletedAt) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }

    await this.ensureMerchantAccess(ctx, program.merchantId)
    await this.ensureCanEditStreakBase(ctx, program.merchantId)

    this.streakValidationService.validateStreakProgramInput({
      graceDays: data.graceDays,
      streakingInterval: data.streakingInterval,
    })

    const updateData: {
      name?: string
      description?: string
      streakingPolicy?: StreakingPolicy
      streakingInterval?: number
      timezone?: string
      graceDays?: number
      repeatable?: boolean
      isActive?: boolean
      requiredConsecutiveDays?: number
      rewardId?: string | null
      stages?: {
        deleteMany: {}
        create: Array<{
          dayThreshold: number
          benefitType: StreakBenefitTypeValue
          rewardId?: string
          infoMessage?: string
          pointsMultiplier?: number
          pointsAmount?: number
        }>
      }
    } = {
      name: data.name,
      description: data.description,
      streakingPolicy: data.streakingPolicy,
      streakingInterval: data.streakingInterval,
      timezone: data.timezone,
      graceDays: data.graceDays,
      repeatable: data.repeatable,
      isActive: data.isActive,
    }

    if (data.stages !== undefined) {
      const stages = this.streakValidationService.normalizeStages(data.stages)
      await this.streakValidationService.validateStageRewards({
        prisma: ctx.prisma,
        merchantId: program.merchantId,
        stages,
      })
      await this.streakValidationService.validatePointsBenefitsAvailability({
        prisma: ctx.prisma,
        merchantId: program.merchantId,
        stages,
      })
      const requiredConsecutiveDays = this.resolveRequiredConsecutiveDays(stages)
      const finalRewardId = stages[stages.length - 1]?.rewardId ?? null

      updateData.requiredConsecutiveDays = requiredConsecutiveDays
      updateData.rewardId = finalRewardId
      updateData.stages = {
        deleteMany: {},
        create: stages.map((stage) => ({
          dayThreshold: stage.dayThreshold,
          benefitType: stage.benefitType,
          rewardId: stage.rewardId,
          infoMessage: stage.infoMessage,
          pointsMultiplier: stage.pointsMultiplier,
          pointsAmount: stage.pointsAmount,
        })),
      }
    }

    return ((await ctx.prisma.streakProgram.update({
      where: { id: streakProgramId },
      data: updateData,
      include: this.streakProgramInclude,
    })) as unknown) as StreakProgram
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteStreakProgram(@Arg('streakProgramId') streakProgramId: string, @Ctx() ctx: Context): Promise<boolean> {
    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      select: {
        id: true,
        merchantId: true,
        deletedAt: true,
      },
    })

    if (!program) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }

    await this.ensureMerchantAccess(ctx, program.merchantId)
    await this.ensureCanEditStreakBase(ctx, program.merchantId)

    if (program.deletedAt) {
      return true
    }

    await ctx.prisma.streakProgram.update({
      where: { id: streakProgramId },
      data: {
        deletedAt: new Date(),
      },
    })

    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => UserStreakStatus)
  async registerStreakVisit(
    @Arg('data') data: RegisterStreakVisitInput,
    @Ctx() ctx: Context
  ): Promise<UserStreakStatus> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: data.streakProgramId },
      include: { merchant: true, reward: true, stages: { orderBy: { dayThreshold: 'asc' } } },
    })
    if (!program || !program.isActive || program.deletedAt) {
      throw new ErrorWithStatus(404, 'Streak program not found or inactive')
    }
    const effectiveStages = this.resolveEffectiveStages(program)
    if (effectiveStages.length < 1) {
      throw new ErrorWithStatus(409, 'Streak program has no configured stages')
    }

    const targetUser = await this.resolveTargetUser(ctx, data.userId)
    if (this.canManageMerchantResources(currentUser.roles)) {
      await this.ensureMerchantAccess(ctx, program.merchantId)
    }

    const visitAt = data.visitAt ?? new Date()
    const timezone = data.timezone || program.timezone || 'UTC'
    let localDate: Date
    try {
      localDate = resolveDateInTimezone(visitAt, timezone)
    } catch (_error) {
      throw new ErrorWithStatus(400, 'Invalid timezone')
    }

    const state = await ctx.prisma.$transaction(async (tx) => {
      let visitWasCreated = false

      try {
        await tx.streakVisit.create({
          data: {
            userId: targetUser.id,
            merchantId: program.merchantId,
            streakProgramId: program.id,
            visitAt,
            localDate,
            source: data.source,
            idempotencyKey: data.idempotencyKey,
            merchantStoreId: data.merchantStoreId,
          },
        })
        visitWasCreated = true
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error
        }
      }

      const currentState = await tx.userStreakState.findUnique({
        where: {
          UniqueUserStreakState: {
            userId: targetUser.id,
            streakProgramId: program.id,
          },
        },
      })

      if (!visitWasCreated) {
        return currentState
      }

      await touchUserMerchantActivity(tx, { userId: targetUser.id, merchantId: program.merchantId })

      if (!currentState) {
        const initialCurrentStreak = 1
        const initialClaimableRewardsCount = countAchievedRewards(
          initialCurrentStreak,
          effectiveStages,
          program.repeatable
        )

        return tx.userStreakState.create({
          data: {
            userId: targetUser.id,
            merchantId: program.merchantId,
            streakProgramId: program.id,
            currentStreak: initialCurrentStreak,
            lastVisitLocalDate: localDate,
            longestStreak: initialCurrentStreak,
            claimableRewardsCount: initialClaimableRewardsCount,
            claimedCycles: 0,
          },
        })
      }

      const lastVisitLocalDate = currentState.lastVisitLocalDate
      let nextCurrentStreak = currentState.currentStreak

      if (!lastVisitLocalDate) {
        nextCurrentStreak = 1
      } else {
        const differenceInPeriods = resolvePeriodDifference(
          lastVisitLocalDate,
          localDate,
          program.streakingPolicy ?? StreakingPolicy.DAILY,
          program.streakingInterval ?? 1
        )

        if (differenceInPeriods === 1) {
          nextCurrentStreak = currentState.currentStreak + 1
        } else if (differenceInPeriods > 1 + program.graceDays) {
          nextCurrentStreak = 1
        }
      }

      const nextLongestStreak = Math.max(currentState.longestStreak, nextCurrentStreak)
      const totalAchievedRewards = countAchievedRewards(nextCurrentStreak, effectiveStages, program.repeatable)
      const alreadyAllocatedCycles = currentState.claimedCycles + currentState.claimableRewardsCount
      const newlyClaimableCycles = Math.max(0, totalAchievedRewards - alreadyAllocatedCycles)

      return tx.userStreakState.update({
        where: { id: currentState.id },
        data: {
          currentStreak: nextCurrentStreak,
          lastVisitLocalDate: localDate,
          longestStreak: nextLongestStreak,
          claimableRewardsCount: currentState.claimableRewardsCount + newlyClaimableCycles,
        },
      })
    })

    const userRewardService = new UserRewardService(ctx.prisma)
    await userRewardService.refreshAvailableRewardsForUser(targetUser.id, [program.merchantId])

    return this.buildStatus((program as unknown) as StreakProgram, effectiveStages, state)
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => StreakRewardClaim)
  async claimStreakReward(
    @Arg('streakProgramId') streakProgramId: string,
    @Arg('userId', () => String, { nullable: true }) userId: string | undefined,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<StreakRewardClaim> {
    const currentUser = ctx.req.user
    if (!currentUser) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      include: { stages: { orderBy: { dayThreshold: 'asc' } } },
    })
    if (!program || program.deletedAt) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }

    const targetUser = await this.resolveTargetUser(ctx, userId)
    if (this.canManageMerchantResources(currentUser.roles)) {
      await this.ensureMerchantAccess(ctx, program.merchantId)
    }
    const effectiveStages = this.resolveEffectiveStages(program)
    if (effectiveStages.length < 1) {
      throw new ErrorWithStatus(409, 'Streak program has no configured stages')
    }

    return await ctx.prisma.$transaction(async (tx) => {
      const state = await tx.userStreakState.findUnique({
        where: {
          UniqueUserStreakState: {
            userId: targetUser.id,
            streakProgramId,
          },
        },
      })
      if (!state || state.claimableRewardsCount < 1) {
        throw new ErrorWithStatus(409, 'No claimable streak rewards')
      }
      const nextClaim = resolveNextClaimableStage({
        currentStreak: state.currentStreak,
        claimedRewardsCount: state.claimedCycles,
        stages: effectiveStages,
        repeatable: program.repeatable,
      })
      if (!nextClaim) {
        throw new ErrorWithStatus(409, 'No claimable streak rewards')
      }

      const nextClaimableRewardsCount = state.claimableRewardsCount - 1
      const nextClaimedCycles = state.claimedCycles + 1

      await tx.userStreakState.update({
        where: { id: state.id },
        data: {
          claimableRewardsCount: nextClaimableRewardsCount,
          claimedCycles: nextClaimedCycles,
        },
      })

      if (
        nextClaim.stage.benefitType === StreakBenefitType.FIXED_POINTS &&
        nextClaim.stage.pointsAmount !== undefined &&
        nextClaim.stage.pointsAmount > 0
      ) {
        const pointsProgram = await tx.merchantPointsProgram.findUnique({
          where: { merchantId: program.merchantId },
          select: { id: true, isActive: true },
        })
        if (!pointsProgram?.isActive) {
          throw new ErrorWithStatus(409, 'Cannot grant streak reward points without active merchant points program')
        }

        const userBalance = await tx.userMerchantPointBalance.findUnique({
          where: {
            userId_merchantId: {
              userId: targetUser.id,
              merchantId: program.merchantId,
            },
          },
        })

        const pointsToAdd = nextClaim.stage.pointsAmount
        const balanceBefore = userBalance?.availablePoints ?? 0
        const balanceAfter = balanceBefore + pointsToAdd

        if (!userBalance) {
          await tx.userMerchantPointBalance.create({
            data: {
              userId: targetUser.id,
              merchantId: program.merchantId,
              totalPoints: pointsToAdd,
              availablePoints: pointsToAdd,
              lockedPoints: 0,
            },
          })
        } else {
          await tx.userMerchantPointBalance.update({
            where: { id: userBalance.id },
            data: {
              totalPoints: { increment: pointsToAdd },
              availablePoints: { increment: pointsToAdd },
            },
          })
        }

        await tx.merchantPointTransaction.create({
          data: {
            userId: targetUser.id,
            merchantId: program.merchantId,
            merchantPointsProgramId: pointsProgram.id,
            type: 'BONUS',
            amount: pointsToAdd,
            description: `Streak reward: ${program.name}`,
            referenceId: program.id,
            referenceType: 'STREAK_PROGRAM',
            balanceBefore,
            balanceAfter,
            merchantStoreId: storeId,
          },
        })
        await touchUserMerchantActivity(tx, { userId: targetUser.id, merchantId: program.merchantId })
      }

      const rewardClaim = await tx.streakRewardClaim.create({
        data: {
          userId: targetUser.id,
          merchantId: program.merchantId,
          streakProgramId: program.id,
          benefitType: nextClaim.stage.benefitType,
          rewardId: nextClaim.stage.rewardId ?? null,
          infoMessage: nextClaim.stage.infoMessage ?? null,
          pointsMultiplier: nextClaim.stage.pointsMultiplier ?? null,
          pointsAmount: nextClaim.stage.pointsAmount ?? null,
          streakStageId: nextClaim.stage.id ?? null,
          cycleNumber: nextClaim.cycleNumber,
        },
      })

      const stageReward = rewardClaim.rewardId
        ? await tx.reward.findUnique({
            where: { id: rewardClaim.rewardId },
            select: {
              title: true,
              description: true,
            },
          })
        : null

      const userRewardService = new UserRewardService(tx)
      await userRewardService.upsertReward({
        userId: targetUser.id,
        sourceType: UserRewardSourceType.STREAK,
        sourceEntityId: program.id,
        sourceSubEntityId: `${nextClaim.stage.id ?? nextClaim.stage.dayThreshold}:${nextClaim.cycleNumber}`,
        status: UserRewardStatus.CLAIMED,
        title: stageReward?.title ?? rewardClaim.infoMessage ?? program.name,
        description: stageReward?.description ?? rewardClaim.infoMessage ?? program.description ?? undefined,
        merchantId: program.merchantId,
        rewardId: rewardClaim.rewardId ?? undefined,
        claimedAt: rewardClaim.claimedAt,
        payload: {
          dayThreshold: nextClaim.stage.dayThreshold,
          cycleNumber: nextClaim.cycleNumber,
        },
      })

      return {
        ...rewardClaim,
        benefitType: StreakBenefitType[rewardClaim.benefitType],
        rewardId: rewardClaim.rewardId ?? undefined,
        infoMessage: rewardClaim.infoMessage ?? undefined,
        pointsMultiplier: rewardClaim.pointsMultiplier ?? undefined,
        pointsAmount: rewardClaim.pointsAmount ?? undefined,
        streakStageId: rewardClaim.streakStageId ?? undefined,
      }
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => StreakProgram)
  async upsertStreakProgramStoreOverride(
    @Arg('streakProgramId') streakProgramId: string,
    @Arg('storeId') storeId: string,
    @Arg('data') data: UpsertStreakProgramStoreOverrideInput,
    @Ctx() ctx: Context
  ): Promise<StreakProgram> {
    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      include: this.streakProgramInclude,
    })
    if (!program) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true },
    })
    if (!store || store.merchantId !== program.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to streak merchant')
    }
    await this.ensureStoreAccess(ctx, program.merchantId, storeId)
    await this.ensureCanEditStreakOverride(ctx, program.merchantId)

    await ctx.prisma.streakProgramStoreOverride.upsert({
      where: {
        UniqueStreakProgramStoreOverride: {
          streakProgramId,
          merchantStoreId: storeId,
        },
      },
      create: {
        streakProgramId,
        merchantStoreId: storeId,
        updatedByUserId: ctx.req.user!.id,
        ...data,
      },
      update: {
        updatedByUserId: ctx.req.user!.id,
        ...data,
      },
    })

    const override = await ctx.prisma.streakProgramStoreOverride.findUnique({
      where: {
        UniqueStreakProgramStoreOverride: {
          streakProgramId,
          merchantStoreId: storeId,
        },
      },
    })

    return this.applyStreakStoreOverride((program as unknown) as StreakProgram, override)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteStreakProgramStoreOverride(
    @Arg('streakProgramId') streakProgramId: string,
    @Arg('storeId') storeId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const program = await ctx.prisma.streakProgram.findUnique({
      where: { id: streakProgramId },
      select: { merchantId: true },
    })
    if (!program) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }
    await this.ensureStoreAccess(ctx, program.merchantId, storeId)
    await this.ensureCanEditStreakOverride(ctx, program.merchantId)
    await ctx.prisma.streakProgramStoreOverride.deleteMany({
      where: { streakProgramId, merchantStoreId: storeId },
    })
    return true
  }
}
