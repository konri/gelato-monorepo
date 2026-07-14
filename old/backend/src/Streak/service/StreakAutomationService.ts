import { PrismaClient, UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import {
  countAchievedRewards,
  resolveDateInTimezone,
  resolveNextClaimableStage,
  resolvePeriodDifference,
  StageSnapshot,
} from './StreakDomain'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'

export class StreakAutomationService {
  constructor(private prisma: PrismaClient) {}

  async processVisitForMerchantAction(input: {
    userId: string
    merchantId: string
    visitAt?: Date
    timezone?: string
    source: string
    pointsEarnedFromAction?: number
    merchantStoreId?: string
  }): Promise<void> {
    const programs = await this.prisma.streakProgram.findMany({
      where: {
        merchantId: input.merchantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        stages: { orderBy: { dayThreshold: 'asc' } },
      },
    })

    if (programs.length < 1) {
      await touchUserMerchantActivity(this.prisma, { userId: input.userId, merchantId: input.merchantId })
      return
    }

    const visitAt = input.visitAt ?? new Date()

    for (const program of programs) {
      const timezone = input.timezone || program.timezone || 'UTC'
      const localDate = resolveDateInTimezone(visitAt, timezone)
      const idempotencyKey = `${input.source}:${input.userId}:${program.id}:${localDate.toISOString()}`

      await this.prisma.$transaction(async (tx) => {
        let visitWasCreated = false

        try {
          await tx.streakVisit.create({
            data: {
              userId: input.userId,
              merchantId: input.merchantId,
              streakProgramId: program.id,
              visitAt,
              localDate,
              source: input.source,
              idempotencyKey,
              merchantStoreId: input.merchantStoreId,
            },
          })
          visitWasCreated = true
        } catch (error) {
          const maybeCode = (error as { code?: string }).code
          if (maybeCode !== 'P2002') {
            throw error
          }
        }

        if (!visitWasCreated) {
          return
        }

        const stages = program.stages
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

        if (stages.length < 1) {
          return
        }

        const currentState = await tx.userStreakState.findUnique({
          where: {
            UniqueUserStreakState: {
              userId: input.userId,
              streakProgramId: program.id,
            },
          },
        })

        if (!currentState) {
          const initialCurrentStreak = 1
          const initialClaimableRewardsCount = countAchievedRewards(initialCurrentStreak, stages, program.repeatable)

          await tx.userStreakState.create({
            data: {
              userId: input.userId,
              merchantId: input.merchantId,
              streakProgramId: program.id,
              currentStreak: initialCurrentStreak,
              lastVisitLocalDate: localDate,
              longestStreak: initialCurrentStreak,
              claimableRewardsCount: initialClaimableRewardsCount,
              claimedCycles: 0,
            },
          })
        } else {
          const lastVisitLocalDate = currentState.lastVisitLocalDate
          let nextCurrentStreak = currentState.currentStreak

          if (!lastVisitLocalDate) {
            nextCurrentStreak = 1
          } else {
            const differenceInPeriods = resolvePeriodDifference(
              lastVisitLocalDate,
              localDate,
              program.streakingPolicy,
              program.streakingInterval
            )

            if (differenceInPeriods === 1) {
              nextCurrentStreak = currentState.currentStreak + 1
            } else if (differenceInPeriods > 1 + program.graceDays) {
              nextCurrentStreak = 1
            }
          }

          const nextLongestStreak = Math.max(currentState.longestStreak, nextCurrentStreak)
          const totalAchievedRewards = countAchievedRewards(nextCurrentStreak, stages, program.repeatable)
          const alreadyAllocatedCycles = currentState.claimedCycles + currentState.claimableRewardsCount
          const newlyClaimableCycles = Math.max(0, totalAchievedRewards - alreadyAllocatedCycles)

          await tx.userStreakState.update({
            where: { id: currentState.id },
            data: {
              currentStreak: nextCurrentStreak,
              lastVisitLocalDate: localDate,
              longestStreak: nextLongestStreak,
              claimableRewardsCount: currentState.claimableRewardsCount + newlyClaimableCycles,
            },
          })
        }
      })

      await this.autoApplyNonRewardClaims({
        userId: input.userId,
        merchantId: input.merchantId,
        programId: program.id,
        pointsEarnedFromAction: input.pointsEarnedFromAction,
        merchantStoreId: input.merchantStoreId,
      })
    }

    await touchUserMerchantActivity(this.prisma, { userId: input.userId, merchantId: input.merchantId })
  }

  private async autoApplyNonRewardClaims(input: {
    userId: string
    merchantId: string
    programId: string
    pointsEarnedFromAction?: number
    merchantStoreId?: string
  }): Promise<void> {
    let shouldContinue = true

    while (shouldContinue) {
      shouldContinue = false

      await this.prisma.$transaction(async (tx) => {
        const program = await tx.streakProgram.findUnique({
          where: { id: input.programId },
          include: { stages: { orderBy: { dayThreshold: 'asc' } } },
        })

        if (!program || !program.isActive || program.deletedAt || program.stages.length < 1) {
          return
        }

        const state = await tx.userStreakState.findUnique({
          where: {
            UniqueUserStreakState: {
              userId: input.userId,
              streakProgramId: program.id,
            },
          },
        })

        if (!state || state.claimableRewardsCount < 1) {
          return
        }

        const stages = program.stages.map((stage) => ({
          id: stage.id,
          dayThreshold: stage.dayThreshold,
          benefitType: stage.benefitType,
          rewardId: stage.rewardId ?? undefined,
          infoMessage: stage.infoMessage ?? undefined,
          pointsMultiplier: stage.pointsMultiplier ?? undefined,
          pointsAmount: stage.pointsAmount ?? undefined,
        }))

        const nextClaim = resolveNextClaimableStage({
          currentStreak: state.currentStreak,
          claimedRewardsCount: state.claimedCycles,
          stages,
          repeatable: program.repeatable,
        })

        if (!nextClaim) {
          return
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

        let bonusPoints = 0

        if (
          nextClaim.stage.benefitType === 'POINTS_MULTIPLIER' &&
          nextClaim.stage.pointsMultiplier !== undefined &&
          nextClaim.stage.pointsMultiplier > 1 &&
          input.pointsEarnedFromAction !== undefined &&
          input.pointsEarnedFromAction > 0
        ) {
          const additional = Math.floor(input.pointsEarnedFromAction * (nextClaim.stage.pointsMultiplier - 1))
          bonusPoints = Math.max(0, additional)
        }

        if (
          nextClaim.stage.benefitType === 'FIXED_POINTS' &&
          nextClaim.stage.pointsAmount !== undefined &&
          nextClaim.stage.pointsAmount > 0
        ) {
          bonusPoints = nextClaim.stage.pointsAmount
        }

        if (bonusPoints > 0) {
          const pointsProgram = await tx.merchantPointsProgram.findUnique({
            where: { merchantId: input.merchantId },
            select: { id: true, isActive: true },
          })
          if (!pointsProgram?.isActive) {
            throw new ErrorWithStatus(409, 'Cannot grant streak bonus points without active merchant points program')
          }

          const userBalance = await tx.userMerchantPointBalance.findUnique({
            where: {
              userId_merchantId: {
                userId: input.userId,
                merchantId: input.merchantId,
              },
            },
          })

          const balanceBefore = userBalance?.availablePoints ?? 0
          const balanceAfter = balanceBefore + bonusPoints

          if (!userBalance) {
            await tx.userMerchantPointBalance.create({
              data: {
                userId: input.userId,
                merchantId: input.merchantId,
                totalPoints: bonusPoints,
                availablePoints: bonusPoints,
                lockedPoints: 0,
              },
            })
          } else {
            await tx.userMerchantPointBalance.update({
              where: { id: userBalance.id },
              data: {
                totalPoints: { increment: bonusPoints },
                availablePoints: { increment: bonusPoints },
              },
            })
          }

          await tx.merchantPointTransaction.create({
            data: {
              userId: input.userId,
              merchantId: input.merchantId,
              merchantPointsProgramId: pointsProgram.id,
              type: 'BONUS',
              amount: bonusPoints,
              description: `Streak benefit: ${program.name}`,
              referenceId: program.id,
              referenceType: 'STREAK_PROGRAM',
              balanceBefore,
              balanceAfter,
              merchantStoreId: input.merchantStoreId,
            },
          })
        }

        const rewardClaim = await tx.streakRewardClaim.create({
          data: {
            userId: input.userId,
            merchantId: input.merchantId,
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

        const shouldCreateUserReward =
          nextClaim.stage.benefitType !== 'POINTS_MULTIPLIER' && nextClaim.stage.benefitType !== 'FIXED_POINTS'

        if (shouldCreateUserReward) {
          const userRewardService = new UserRewardService(tx)
          await userRewardService.upsertReward({
            userId: input.userId,
            sourceType: UserRewardSourceType.STREAK,
            sourceEntityId: program.id,
            sourceSubEntityId: `${nextClaim.stage.id ?? nextClaim.stage.dayThreshold}:${nextClaim.cycleNumber}`,
            status: UserRewardStatus.CLAIMED,
            title: stageReward?.title ?? rewardClaim.infoMessage ?? program.name,
            description: stageReward?.description ?? rewardClaim.infoMessage ?? program.description ?? undefined,
            merchantId: input.merchantId,
            rewardId: rewardClaim.rewardId ?? undefined,
            claimedAt: rewardClaim.claimedAt,
            payload: {
              dayThreshold: nextClaim.stage.dayThreshold,
              cycleNumber: nextClaim.cycleNumber,
            },
          })
        }

        shouldContinue = true
      })
    }
  }
}
