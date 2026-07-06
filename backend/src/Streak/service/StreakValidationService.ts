import { PrismaClient } from '@prisma/client'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { CreateStreakStageInput } from '../inputType/CreateStreakStageInput'
import { StreakBenefitType } from '../objectType/StreakBenefitType'
import { StageSnapshot } from './StreakDomain'

type StreakProgramValidationInput = {
  graceDays?: number
  streakingInterval?: number
}

type StageRewardsValidationInput = {
  prisma: PrismaClient
  merchantId: string
  stages: StageSnapshot[]
}

export class StreakValidationService {
  validateStreakProgramInput(input: StreakProgramValidationInput): void {
    if (input.graceDays !== undefined && input.graceDays < 0) {
      throw new ErrorWithStatus(400, 'graceDays cannot be negative')
    }

    if (input.streakingInterval !== undefined && input.streakingInterval < 1) {
      throw new ErrorWithStatus(400, 'streakingInterval must be greater than 0')
    }
  }

  normalizeStages(stages: CreateStreakStageInput[]): StageSnapshot[] {
    if (stages.length < 1) {
      throw new ErrorWithStatus(400, 'At least one streak stage is required')
    }

    const uniqueThresholds = new Set<number>()

    return [...stages]
      .map((stage) => {
        if (stage.dayThreshold < 1) {
          throw new ErrorWithStatus(400, 'stage.dayThreshold must be greater than 0')
        }
        if (uniqueThresholds.has(stage.dayThreshold)) {
          throw new ErrorWithStatus(400, 'Stage dayThreshold values must be unique')
        }
        uniqueThresholds.add(stage.dayThreshold)

        const benefitType =
          stage.benefitType ?? (stage.rewardId ? StreakBenefitType.REWARD : StreakBenefitType.INFO_ONLY)
        const infoMessage = stage.infoMessage?.trim() || undefined
        const pointsMultiplier = stage.pointsMultiplier
        const pointsAmount = stage.pointsAmount

        if (benefitType === StreakBenefitType.REWARD && !stage.rewardId) {
          throw new ErrorWithStatus(400, 'rewardId is required for REWARD stage')
        }
        if (benefitType !== StreakBenefitType.REWARD && stage.rewardId) {
          throw new ErrorWithStatus(400, 'rewardId can only be set for REWARD stage')
        }
        if (benefitType === StreakBenefitType.POINTS_MULTIPLIER) {
          if (pointsMultiplier === undefined || pointsMultiplier <= 1) {
            throw new ErrorWithStatus(400, 'pointsMultiplier must be greater than 1 for POINTS_MULTIPLIER stage')
          }
        } else if (pointsMultiplier !== undefined) {
          throw new ErrorWithStatus(400, 'pointsMultiplier can only be set for POINTS_MULTIPLIER stage')
        }
        if (benefitType === StreakBenefitType.FIXED_POINTS) {
          if (pointsAmount === undefined || pointsAmount < 1) {
            throw new ErrorWithStatus(400, 'pointsAmount must be greater than 0 for FIXED_POINTS stage')
          }
        } else if (pointsAmount !== undefined) {
          throw new ErrorWithStatus(400, 'pointsAmount can only be set for FIXED_POINTS stage')
        }
        if (benefitType === StreakBenefitType.INFO_ONLY && !infoMessage) {
          throw new ErrorWithStatus(400, 'infoMessage is required for INFO_ONLY stage')
        }
        if (benefitType !== StreakBenefitType.INFO_ONLY && infoMessage) {
          throw new ErrorWithStatus(400, 'infoMessage can only be set for INFO_ONLY stage')
        }

        return {
          dayThreshold: stage.dayThreshold,
          benefitType,
          rewardId: stage.rewardId,
          infoMessage,
          pointsMultiplier,
          pointsAmount,
        }
      })
      .sort((a, b) => a.dayThreshold - b.dayThreshold)
  }

  async validateStageRewards(input: StageRewardsValidationInput): Promise<void> {
    const rewardIds = input.stages
      .map((stage) => stage.rewardId)
      .filter((rewardId): rewardId is string => Boolean(rewardId))

    if (!rewardIds.length) {
      return
    }

    const rewards = await input.prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, merchantId: true },
    })

    if (rewards.length !== rewardIds.length) {
      throw new ErrorWithStatus(404, 'Reward not found')
    }

    const hasRewardFromAnotherMerchant = rewards.some(
      (reward) => reward.merchantId && reward.merchantId !== input.merchantId
    )
    if (hasRewardFromAnotherMerchant) {
      throw new ErrorWithStatus(403, 'Reward belongs to different merchant')
    }
  }

  async validatePointsBenefitsAvailability(input: StageRewardsValidationInput): Promise<void> {
    const hasPointsBenefits = input.stages.some(
      (stage) =>
        stage.benefitType === StreakBenefitType.POINTS_MULTIPLIER ||
        stage.benefitType === StreakBenefitType.FIXED_POINTS
    )

    if (!hasPointsBenefits) {
      return
    }

    const activeProgram = await input.prisma.merchantPointsProgram.findUnique({
      where: { merchantId: input.merchantId },
      select: { isActive: true },
    })

    if (!activeProgram?.isActive) {
      throw new ErrorWithStatus(400, 'Point-based streak benefits require an active merchant points program')
    }
  }
}
