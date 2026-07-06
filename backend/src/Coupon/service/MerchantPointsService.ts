import { PrismaClient } from '@prisma/client'
import { StreakAutomationService } from '../../Streak/service/StreakAutomationService'
import {
  countAchievedRewards,
  resolveDateInTimezone,
  resolvePeriodDifference,
  StageSnapshot,
  StreakPolicyValue,
} from '../../Streak/service/StreakDomain'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'

type StreakPointPreview = {
  bonusMultiplier?: number
  fixedPoints?: number
}

type StreakStateSnapshot = {
  currentStreak: number
  claimableRewardsCount: number
  claimedCycles: number
  lastVisitLocalDate: Date | null
}

type StreakProgramSnapshot = {
  id: string
  timezone: string | null
  repeatable: boolean
  streakingPolicy: StreakPolicyValue
  streakingInterval: number
  graceDays: number
  stages: StageSnapshot[]
}

export class MerchantPointsService {
  constructor(private prisma: PrismaClient) {}

  private toStageSnapshots(
    stages: Array<{
      dayThreshold: number
      benefitType: StageSnapshot['benefitType']
      pointsMultiplier: number | null
      pointsAmount: number | null
    }>
  ): StageSnapshot[] {
    return stages.map((stage) => ({
      dayThreshold: stage.dayThreshold,
      benefitType: stage.benefitType,
      pointsMultiplier: stage.pointsMultiplier ?? undefined,
      pointsAmount: stage.pointsAmount ?? undefined,
    }))
  }

  private projectStateAfterVisit(input: {
    state: StreakStateSnapshot | null
    localDate: Date
    stages: StageSnapshot[]
    repeatable: boolean
    streakingPolicy: StreakPolicyValue
    streakingInterval: number
    graceDays: number
  }): { currentStreak: number; claimedCycles: number; claimableRewardsCount: number } {
    if (!input.state) {
      return {
        currentStreak: 1,
        claimedCycles: 0,
        claimableRewardsCount: countAchievedRewards(1, input.stages, input.repeatable),
      }
    }

    let nextCurrentStreak = input.state.currentStreak
    if (!input.state.lastVisitLocalDate) {
      nextCurrentStreak = 1
    } else {
      const periodDiff = resolvePeriodDifference(
        input.state.lastVisitLocalDate,
        input.localDate,
        input.streakingPolicy,
        input.streakingInterval
      )
      if (periodDiff === 1) {
        nextCurrentStreak = input.state.currentStreak + 1
      } else if (periodDiff > 1 + input.graceDays) {
        nextCurrentStreak = 1
      }
    }

    const totalAchievedRewards = countAchievedRewards(nextCurrentStreak, input.stages, input.repeatable)
    const alreadyAllocatedCycles = input.state.claimedCycles + input.state.claimableRewardsCount
    const newlyClaimableCycles = Math.max(0, totalAchievedRewards - alreadyAllocatedCycles)

    return {
      currentStreak: nextCurrentStreak,
      claimedCycles: input.state.claimedCycles,
      claimableRewardsCount: input.state.claimableRewardsCount + newlyClaimableCycles,
    }
  }

  private countStageOccurrencesInClaimWindow(input: {
    startClaimIndex: number
    claimCount: number
    stageCount: number
    stageIndex: number
  }): number {
    if (input.claimCount <= 0 || input.stageCount <= 0) {
      return 0
    }
    const start = Math.max(0, input.startClaimIndex)
    const end = start + input.claimCount - 1
    const offset = (input.stageIndex - (start % input.stageCount) + input.stageCount) % input.stageCount
    const firstOccurrence = start + offset
    if (firstOccurrence > end) {
      return 0
    }
    return Math.floor((end - firstOccurrence) / input.stageCount) + 1
  }

  private resolveProgramPointPreview(input: {
    program: StreakProgramSnapshot
    state: StreakStateSnapshot | null
    visitAt: Date
  }): { multiplierBonus: number; fixedPoints: number } {
    const localDate = resolveDateInTimezone(input.visitAt, input.program.timezone || 'UTC')
    const projected = this.projectStateAfterVisit({
      state: input.state,
      localDate,
      stages: input.program.stages,
      repeatable: input.program.repeatable,
      streakingPolicy: input.program.streakingPolicy,
      streakingInterval: input.program.streakingInterval,
      graceDays: input.program.graceDays,
    })

    if (projected.claimableRewardsCount < 1 || input.program.stages.length < 1) {
      return { multiplierBonus: 0, fixedPoints: 0 }
    }

    if (!input.program.repeatable) {
      const achievedStages = input.program.stages.filter((stage) => stage.dayThreshold <= projected.currentStreak)
      const start = Math.max(0, projected.claimedCycles)
      const endExclusive = Math.min(achievedStages.length, start + projected.claimableRewardsCount)
      let multiplierBonus = 0
      let fixedPoints = 0

      for (let i = start; i < endExclusive; i++) {
        const stage = achievedStages[i]
        if (!stage) {
          continue
        }
        if (
          stage.benefitType === 'POINTS_MULTIPLIER' &&
          stage.pointsMultiplier !== undefined &&
          stage.pointsMultiplier > 1
        ) {
          multiplierBonus += stage.pointsMultiplier - 1
        }
        if (stage.benefitType === 'FIXED_POINTS' && stage.pointsAmount !== undefined && stage.pointsAmount > 0) {
          fixedPoints += stage.pointsAmount
        }
      }

      return { multiplierBonus, fixedPoints }
    }

    let multiplierBonus = 0
    let fixedPoints = 0
    const stageCount = input.program.stages.length
    for (let stageIndex = 0; stageIndex < stageCount; stageIndex++) {
      const stage = input.program.stages[stageIndex]
      if (!stage) {
        continue
      }

      const occurrences = this.countStageOccurrencesInClaimWindow({
        startClaimIndex: projected.claimedCycles,
        claimCount: projected.claimableRewardsCount,
        stageCount,
        stageIndex,
      })
      if (occurrences < 1) {
        continue
      }

      if (
        stage.benefitType === 'POINTS_MULTIPLIER' &&
        stage.pointsMultiplier !== undefined &&
        stage.pointsMultiplier > 1
      ) {
        multiplierBonus += occurrences * (stage.pointsMultiplier - 1)
      }
      if (stage.benefitType === 'FIXED_POINTS' && stage.pointsAmount !== undefined && stage.pointsAmount > 0) {
        fixedPoints += occurrences * stage.pointsAmount
      }
    }

    return { multiplierBonus, fixedPoints }
  }

  private async resolvePendingStreakPointPreview(userId: string, merchantId: string): Promise<StreakPointPreview> {
    const states = await this.prisma.userStreakState.findMany({
      where: { userId, merchantId },
      select: {
        streakProgramId: true,
        currentStreak: true,
        claimableRewardsCount: true,
        claimedCycles: true,
        lastVisitLocalDate: true,
      },
    })

    const stateByProgramId = new Map(
      states.map((state) => [
        state.streakProgramId,
        {
          currentStreak: state.currentStreak,
          claimableRewardsCount: state.claimableRewardsCount,
          claimedCycles: state.claimedCycles,
          lastVisitLocalDate: state.lastVisitLocalDate,
        },
      ])
    )
    const stateProgramIds = states.map((state) => state.streakProgramId)
    const streakProgramSelect = {
      id: true,
      timezone: true,
      repeatable: true,
      streakingPolicy: true,
      streakingInterval: true,
      graceDays: true,
      stages: {
        orderBy: { dayThreshold: 'asc' as const },
        select: {
          dayThreshold: true,
          benefitType: true,
          pointsMultiplier: true,
          pointsAmount: true,
        },
      },
    }

    const programsWithState =
      stateProgramIds.length > 0
        ? await this.prisma.streakProgram.findMany({
            where: {
              merchantId,
              isActive: true,
              id: { in: stateProgramIds },
            },
            select: streakProgramSelect,
          })
        : []

    const firstVisitPointPrograms = await this.prisma.streakProgram.findMany({
      where: {
        merchantId,
        isActive: true,
        ...(stateProgramIds.length > 0 ? { id: { notIn: stateProgramIds } } : {}),
        stages: {
          some: {
            dayThreshold: 1,
            OR: [
              { benefitType: 'POINTS_MULTIPLIER', pointsMultiplier: { gt: 1 } },
              { benefitType: 'FIXED_POINTS', pointsAmount: { gt: 0 } },
            ],
          },
        },
      },
      select: streakProgramSelect,
    })

    if (programsWithState.length < 1 && firstVisitPointPrograms.length < 1) {
      return {}
    }

    const visitAt = new Date()
    let totalMultiplierBonus = 0
    let totalFixedPoints = 0
    const applyProgramPreview = (program: typeof programsWithState[number], state: StreakStateSnapshot | null) => {
      const preview = this.resolveProgramPointPreview({
        program: {
          ...program,
          stages: this.toStageSnapshots(program.stages),
        },
        state,
        visitAt,
      })
      totalMultiplierBonus += preview.multiplierBonus
      totalFixedPoints += preview.fixedPoints
    }

    for (const program of programsWithState) {
      applyProgramPreview(program, stateByProgramId.get(program.id) ?? null)
    }

    for (const program of firstVisitPointPrograms) {
      applyProgramPreview(program, null)
    }

    if (totalMultiplierBonus <= 0 && totalFixedPoints <= 0) {
      return {}
    }

    return {
      bonusMultiplier: totalMultiplierBonus > 0 ? 1 + totalMultiplierBonus : undefined,
      fixedPoints: totalFixedPoints > 0 ? totalFixedPoints : undefined,
    }
  }

  private async resolveUserId(userIdentifier: string): Promise<string> {
    const normalizedIdentifier = userIdentifier.trim()
    if (!normalizedIdentifier) {
      throw new ErrorWithStatus(400, 'User identifier is required')
    }

    const isEmail = normalizedIdentifier.includes('@')
    const targetUser = await this.prisma.user.findFirst({
      where: isEmail ? { email: normalizedIdentifier.toLowerCase() } : { id: normalizedIdentifier },
      select: { id: true },
    })
    if (targetUser) {
      return targetUser.id
    }

    throw new ErrorWithStatus(404, `User with ${isEmail ? 'email' : 'id'} ${normalizedIdentifier} not found`)
  }

  private async resolveProgram(
    programId: string,
    requireActiveProgram: boolean
  ): Promise<{
    id: string
    merchantId: string
    isActive: boolean
  }> {
    const program = await this.prisma.merchantPointsProgram.findUnique({
      where: { id: programId },
      select: { id: true, merchantId: true, isActive: true },
    })

    if (!program) {
      throw new ErrorWithStatus(404, 'Merchant points program not found')
    }
    if (requireActiveProgram && !program.isActive) {
      throw new ErrorWithStatus(409, 'Merchant points program is inactive')
    }

    return program
  }

  async getMerchantPointBalance(userIdentifier: string, merchantId: string) {
    const userId = await this.resolveUserId(userIdentifier)

    let balance = await this.prisma.userMerchantPointBalance.findUnique({
      where: {
        userId_merchantId: {
          userId,
          merchantId,
        },
      },
      include: { merchant: true },
    })

    if (!balance) {
      balance = await this.prisma.userMerchantPointBalance.create({
        data: {
          userId,
          merchantId,
          totalPoints: 0,
          availablePoints: 0,
          lockedPoints: 0,
        },
        include: { merchant: true },
      })
    }

    const streakPointPreview = await this.resolvePendingStreakPointPreview(userId, merchantId)
    return {
      ...balance,
      ...streakPointPreview,
    }
  }

  async addMerchantPoints(
    userIdentifier: string,
    programId: string,
    amount: number,
    description: string,
    merchantStoreId?: string,
    referenceId?: string,
    referenceType?: string,
    countForStreak = true,
    requireActiveProgram = true
  ) {
    const program = await this.resolveProgram(programId, requireActiveProgram)
    const merchantId = program.merchantId

    const balance = await this.getMerchantPointBalance(userIdentifier, merchantId)
    const userId = balance.userId

    const basePointsBalance = await this.prisma.userMerchantPointBalance.update({
      where: { id: balance.id },
      data: {
        totalPoints: { increment: amount },
        availablePoints: { increment: amount },
      },
      include: { merchant: true },
    })

    await this.prisma.merchantPointTransaction.create({
      data: {
        userId,
        merchantId,
        merchantPointsProgramId: program.id,
        type: 'EARNED',
        amount,
        description,
        referenceId,
        referenceType,
        balanceBefore: balance.availablePoints,
        balanceAfter: basePointsBalance.availablePoints,
        merchantStoreId,
      },
    })

    const callStreakVisit = countForStreak && amount > 0
    if (!callStreakVisit) {
      await touchUserMerchantActivity(this.prisma, { userId, merchantId })
    }

    if (callStreakVisit) {
      const streakAutomationService = new StreakAutomationService(this.prisma)
      await streakAutomationService.processVisitForMerchantAction({
        userId,
        merchantId,
        source: 'POINTS_EARNED',
        pointsEarnedFromAction: amount,
        merchantStoreId,
      })
    }

    const userRewardService = new UserRewardService(this.prisma)
    await userRewardService.refreshAvailableRewardsForUser(userId, [merchantId])

    return this.getMerchantPointBalance(userId, merchantId)
  }

  async spendMerchantPoints(
    userIdentifier: string,
    merchantId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
    merchantStoreId?: string
  ) {
    const balance = await this.getMerchantPointBalance(userIdentifier, merchantId)
    const userId = balance.userId

    if (balance.availablePoints < amount) {
      throw new Error('Insufficient merchant points')
    }

    const newBalance = await this.prisma.userMerchantPointBalance.update({
      where: { id: balance.id },
      data: {
        availablePoints: { decrement: amount },
      },
      include: { merchant: true },
    })

    await this.prisma.merchantPointTransaction.create({
      data: {
        userId,
        merchantId,
        merchantPointsProgramId: null,
        type: 'SPENT',
        amount: -amount,
        description,
        referenceId,
        referenceType,
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
        merchantStoreId,
      },
    })

    await touchUserMerchantActivity(this.prisma, { userId, merchantId })

    const userRewardService = new UserRewardService(this.prisma)
    await userRewardService.refreshAvailableRewardsForUser(userId, [merchantId])

    return newBalance
  }

  async getMerchantPointTransactions(userIdentifier: string, merchantId: string) {
    const userId = await this.resolveUserId(userIdentifier)

    return this.prisma.merchantPointTransaction.findMany({
      where: {
        userId,
        merchantId,
      },
      include: {
        user: true,
        merchant: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
