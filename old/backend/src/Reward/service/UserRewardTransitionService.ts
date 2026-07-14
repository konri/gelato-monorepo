import { Prisma, PrismaClient, UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { UserRewardService } from './UserRewardService'
import { resolveNextClaimableStage, StageSnapshot } from '../../Streak/service/StreakDomain'
import { StreakBenefitType } from '../../Streak/objectType/StreakBenefitType'
import { TransactionType } from '../../Points/objectType/PointTransaction'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'
import { mergePrismaCouponWithOverride } from '../../Coupon/service/couponMerge'
import { assertCouponClaimAllowed } from '../../Coupon/service/couponRules'
import { applyCouponRedemptionInTransaction } from '../../Coupon/service/couponRedemption'

type UserRewardActorContext = {
  userRewardId: string
  actorId: string
  actorRoles: string[]
  targetCardId?: string
}

type UserRewardClaimInput = UserRewardActorContext & {
  storeId?: string
}

type UserRewardRedeemInput = UserRewardActorContext & {
  storeId: string
}

function optionalMerchantStoreIdOnClaim(
  storeId: string | undefined
): { merchantStoreId: string } | Record<string, never> {
  return storeId ? { merchantStoreId: storeId } : {}
}

type TransitionType = 'CLAIM' | 'REDEEM'

type CouponClaimCandidate = {
  isStackable: boolean
  exclusivityGroups: string[]
}

export class UserRewardTransitionService {
  constructor(private prisma: PrismaClient) {}

  private isOperator(roles: string[]): boolean {
    return roles.includes('ADMIN') || roles.includes('OWNER') || roles.includes('COOPERATOR')
  }

  private async hasAccessToMerchant(
    tx: PrismaClient | Prisma.TransactionClient,
    actorId: string,
    roles: string[],
    merchantId: string
  ): Promise<boolean> {
    if (roles.includes('ADMIN')) {
      return true
    }
    if (roles.includes('OWNER')) {
      const company = await tx.company.findFirst({
        where: {
          userId: actorId,
          merchant: { id: merchantId },
        },
      })
      if (company) {
        return true
      }
    }
    if (roles.includes('COOPERATOR')) {
      const cooperatorCompany = await tx.cooperatorCompany.findFirst({
        where: {
          cooperator: { userId: actorId },
          deletedAt: null,
          companyOwner: { company: { merchant: { id: merchantId } } },
        },
      })
      if (cooperatorCompany) {
        return true
      }
    }
    return false
  }

  private static hasSharedExclusivityGroups(firstGroups: string[], secondGroups: string[]): boolean {
    if (firstGroups.length === 0 || secondGroups.length === 0) {
      return false
    }
    const secondGroupsSet = new Set(secondGroups)
    return firstGroups.some((group) => secondGroupsSet.has(group))
  }

  private static areCouponsCompatible(firstCoupon: CouponClaimCandidate, secondCoupon: CouponClaimCandidate): boolean {
    if (!firstCoupon.isStackable || !secondCoupon.isStackable) {
      return false
    }
    return !UserRewardTransitionService.hasSharedExclusivityGroups(
      firstCoupon.exclusivityGroups,
      secondCoupon.exclusivityGroups
    )
  }

  private static validateCouponCompatibility(
    coupon: CouponClaimCandidate,
    activeCoupons: CouponClaimCandidate[]
  ): void {
    const hasConflict = activeCoupons.some(
      (activeCoupon) => !UserRewardTransitionService.areCouponsCompatible(coupon, activeCoupon)
    )
    if (hasConflict) {
      throw new ErrorWithStatus(409, 'COUPON_CLAIM_CONFLICTING_COUPON')
    }
  }

  private async getUserRewardOrThrow(userRewardId: string) {
    const userReward = await this.prisma.userReward.findUnique({
      where: { id: userRewardId },
    })
    if (!userReward) {
      throw new ErrorWithStatus(404, 'User reward not found')
    }
    return userReward
  }

  private assertStatusForTransition(status: UserRewardStatus, transitionType: TransitionType): void {
    if (transitionType === 'CLAIM') {
      if (status === UserRewardStatus.CLAIMED) {
        throw new ErrorWithStatus(409, 'Reward already claimed')
      }
      if (status === UserRewardStatus.REDEEMED) {
        throw new ErrorWithStatus(409, 'Reward already redeemed')
      }
      if (status === UserRewardStatus.CANCELLED || status === UserRewardStatus.EXPIRED) {
        throw new ErrorWithStatus(409, 'Reward is no longer claimable')
      }
      if (status !== UserRewardStatus.AVAILABLE) {
        throw new ErrorWithStatus(409, 'Reward is not available for claim')
      }
      return
    }

    if (status === UserRewardStatus.AVAILABLE) {
      throw new ErrorWithStatus(409, 'Reward must be claimed before redeem')
    }
    if (status === UserRewardStatus.REDEEMED) {
      throw new ErrorWithStatus(409, 'Reward already redeemed')
    }
    if (status === UserRewardStatus.CANCELLED || status === UserRewardStatus.EXPIRED) {
      throw new ErrorWithStatus(409, 'Reward is no longer redeemable')
    }
    if (status !== UserRewardStatus.CLAIMED) {
      throw new ErrorWithStatus(409, 'Reward is not in claimable redemption state')
    }
  }

  private async assertActorCanTransition(
    input: UserRewardActorContext,
    userReward: {
      userId: string
      merchantId: string | null
      sourceType: UserRewardSourceType
    },
    transitionType: TransitionType
  ): Promise<void> {
    const operator = this.isOperator(input.actorRoles)
    if (!operator) {
      if (transitionType === 'REDEEM') {
        throw new ErrorWithStatus(403, 'Only operators can redeem rewards')
      }
      if (userReward.userId !== input.actorId) {
        throw new ErrorWithStatus(403, 'No access to selected user')
      }
    } else {
      if (!userReward.merchantId) {
        throw new ErrorWithStatus(400, 'Operator cannot process reward without merchant context')
      }
      const hasAccess = await this.hasAccessToMerchant(
        this.prisma,
        input.actorId,
        input.actorRoles,
        userReward.merchantId
      )
      if (!hasAccess) {
        throw new ErrorWithStatus(403, 'No access to this merchant')
      }
    }

    if (
      transitionType === 'CLAIM' &&
      (userReward.sourceType === UserRewardSourceType.COUPON ||
        userReward.sourceType === UserRewardSourceType.POINT_VOUCHER ||
        userReward.sourceType === UserRewardSourceType.MERCHANT_VOUCHER) &&
      userReward.userId !== input.actorId
    ) {
      throw new ErrorWithStatus(403, 'Only reward owner can claim this reward type')
    }
  }

  async claimUserReward(input: UserRewardClaimInput) {
    const rewardPreview = await this.prisma.userReward.findUnique({
      where: { id: input.userRewardId },
      select: { userId: true, merchantId: true },
    })
    if (!rewardPreview) {
      throw new ErrorWithStatus(404, 'User reward not found')
    }

    const syncRewards = new UserRewardService(this.prisma)
    await syncRewards.refreshAvailableRewardsForUser(
      rewardPreview.userId,
      rewardPreview.merchantId ? [rewardPreview.merchantId] : undefined
    )

    const userReward = await this.getUserRewardOrThrow(input.userRewardId)
    this.assertStatusForTransition(userReward.status, 'CLAIM')
    await this.assertActorCanTransition(input, userReward, 'CLAIM')

    const result = await this.prisma.$transaction(async (tx) => {
      const reloadedUserReward = await tx.userReward.findUnique({
        where: { id: input.userRewardId },
      })
      if (!reloadedUserReward) {
        throw new ErrorWithStatus(404, 'User reward not found')
      }
      this.assertStatusForTransition(reloadedUserReward.status, 'CLAIM')

      let claimedAt = new Date()
      let shouldAwardReferralClientActive = false

      if (
        reloadedUserReward.sourceType === UserRewardSourceType.STAMP_MAIN ||
        reloadedUserReward.sourceType === UserRewardSourceType.STAMP_MILESTONE
      ) {
        claimedAt = await this.claimStampReward(tx, reloadedUserReward, input)
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.STREAK) {
        claimedAt = await this.claimStreakReward(tx, reloadedUserReward, input.storeId)
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.COUPON) {
        claimedAt = await this.claimCouponReward(tx, reloadedUserReward, input.storeId)
        shouldAwardReferralClientActive = true
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.POINT_VOUCHER) {
        claimedAt = await this.claimPointVoucherReward(tx, reloadedUserReward)
        shouldAwardReferralClientActive = true
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.MERCHANT_VOUCHER) {
        claimedAt = await this.claimMerchantVoucherReward(tx, reloadedUserReward, input.storeId)
      } else {
        throw new ErrorWithStatus(400, 'Unsupported reward source type')
      }

      const userRewardService = new UserRewardService(tx)
      await userRewardService.markClaimed(
        {
          userId: reloadedUserReward.userId,
          sourceType: reloadedUserReward.sourceType,
          sourceEntityId: reloadedUserReward.sourceEntityId,
          sourceSubEntityId: reloadedUserReward.sourceSubEntityId || undefined,
        },
        claimedAt
      )

      const claimedReward = await tx.userReward.findUnique({
        where: { id: reloadedUserReward.id },
      })
      if (!claimedReward) {
        throw new ErrorWithStatus(404, 'User reward not found')
      }

      return {
        claimedReward,
        shouldAwardReferralClientActive,
      }
    })

    if (result.shouldAwardReferralClientActive) {
      const { ReferralService } = await import('../../Referral/service/ReferralService')
      await ReferralService.awardReferralPoints(userReward.userId, 'CLIENT_ACTIVE')
    }

    const userRewardService = new UserRewardService(this.prisma)
    await userRewardService.refreshAvailableRewardsForUser(
      userReward.userId,
      userReward.merchantId ? [userReward.merchantId] : undefined
    )

    return result.claimedReward
  }

  async redeemUserReward(input: UserRewardRedeemInput) {
    const userReward = await this.getUserRewardOrThrow(input.userRewardId)
    this.assertStatusForTransition(userReward.status, 'REDEEM')
    await this.assertActorCanTransition(input, userReward, 'REDEEM')

    const result = await this.prisma.$transaction(async (tx) => {
      const reloadedUserReward = await tx.userReward.findUnique({
        where: { id: input.userRewardId },
      })
      if (!reloadedUserReward) {
        throw new ErrorWithStatus(404, 'User reward not found')
      }
      this.assertStatusForTransition(reloadedUserReward.status, 'REDEEM')

      const redeemedAt = new Date()

      if (
        reloadedUserReward.sourceType === UserRewardSourceType.STAMP_MAIN ||
        reloadedUserReward.sourceType === UserRewardSourceType.STAMP_MILESTONE
      ) {
        await this.redeemStampReward(tx, reloadedUserReward, redeemedAt)
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.COUPON) {
        await this.redeemCouponReward(tx, reloadedUserReward, redeemedAt, input.storeId)
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.POINT_VOUCHER) {
        await this.redeemPointVoucherReward(tx, reloadedUserReward, redeemedAt)
      } else if (reloadedUserReward.sourceType === UserRewardSourceType.MERCHANT_VOUCHER) {
        await this.redeemMerchantVoucherReward(tx, reloadedUserReward, redeemedAt)
      }

      const userRewardService = new UserRewardService(tx)
      await userRewardService.markRedeemed(
        {
          userId: reloadedUserReward.userId,
          sourceType: reloadedUserReward.sourceType,
          sourceEntityId: reloadedUserReward.sourceEntityId,
          sourceSubEntityId: reloadedUserReward.sourceSubEntityId || undefined,
        },
        redeemedAt
      )

      const redeemedReward = await tx.userReward.findUnique({
        where: { id: reloadedUserReward.id },
      })
      if (!redeemedReward) {
        throw new ErrorWithStatus(404, 'User reward not found')
      }

      return redeemedReward
    })

    return result
  }

  private async claimStampReward(
    tx: Prisma.TransactionClient,
    userReward: {
      id: string
      userId: string
      sourceType: UserRewardSourceType
      sourceEntityId: string
      sourceSubEntityId: string
    },
    input: UserRewardClaimInput
  ): Promise<Date> {
    const card = await tx.loyaltyStampCard.findUnique({
      where: { id: userReward.sourceEntityId },
      include: { template: true },
    })
    if (!card) {
      throw new ErrorWithStatus(404, 'Card not found')
    }

    if (input.targetCardId && input.targetCardId !== card.id) {
      throw new ErrorWithStatus(400, 'Provided cardId does not match reward card')
    }
    if (!card.isActive) {
      throw new ErrorWithStatus(400, 'Card is no longer active')
    }

    const milestoneId =
      userReward.sourceType === UserRewardSourceType.STAMP_MILESTONE ? userReward.sourceSubEntityId : null
    let claimedAt = new Date()

    if (milestoneId) {
      const milestone = await tx.stampMilestone.findUnique({
        where: { id: milestoneId },
        include: { template: true },
      })
      if (!milestone) {
        throw new ErrorWithStatus(404, 'Milestone not found')
      }
      if (!milestone.isActive) {
        throw new ErrorWithStatus(400, 'Milestone inactive')
      }
      if (milestone.templateId !== card.templateId) {
        throw new ErrorWithStatus(400, 'Milestone does not belong to this card template')
      }
      if (card.stampsCollected < milestone.stampsRequired) {
        throw new ErrorWithStatus(400, `Need ${milestone.stampsRequired} stamps, have ${card.stampsCollected}`)
      }

      const alreadyClaimed = await tx.claimedMilestone.findFirst({
        where: { cardId: card.id, milestoneId: milestone.id },
      })
      if (alreadyClaimed) {
        throw new ErrorWithStatus(409, 'Milestone already claimed on this card')
      }

      const claimed = await tx.claimedMilestone.create({
        data: { cardId: card.id, milestoneId: milestone.id },
      })
      claimedAt = claimed.claimedAt

      if (card.template?.resetStampsOnMilestoneClaim) {
        const balanceBefore = card.stampsCollected
        await tx.loyaltyStamp.updateMany({
          where: { cardId: card.id, isUsed: false },
          data: { isUsed: true, usedAt: new Date() },
        })
        await tx.stampTransaction.create({
          data: {
            userId: card.userId,
            cardId: card.id,
            type: 'USED',
            amount: balanceBefore,
            description: `Milestone claimed: ${milestone.title || 'Milestone'}`,
            balanceBefore,
            balanceAfter: 0,
            referenceId: claimed.id,
            referenceType: 'MILESTONE_CLAIM',
            ...optionalMerchantStoreIdOnClaim(input.storeId),
          },
        })
        await touchUserMerchantActivity(tx, { userId: card.userId, merchantId: card.merchantId })
        await tx.loyaltyStampCard.update({
          where: { id: card.id },
          data: { stampsCollected: 0, isActive: false },
        })
      }
    } else {
      if (card.stampsCollected < card.stampsRequired) {
        throw new ErrorWithStatus(400, `Card not complete. Has ${card.stampsCollected}/${card.stampsRequired} stamps`)
      }
      const alreadyClaimedMainReward = await tx.claimedMilestone.findFirst({
        where: { cardId: card.id, milestoneId: null },
      })
      if (alreadyClaimedMainReward) {
        throw new ErrorWithStatus(409, 'Main reward already claimed on this card')
      }

      const claimed = await tx.claimedMilestone.create({
        data: { cardId: card.id },
      })
      claimedAt = claimed.claimedAt

      await tx.loyaltyStamp.updateMany({
        where: { cardId: card.id, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      })
      await tx.stampTransaction.create({
        data: {
          userId: card.userId,
          cardId: card.id,
          type: 'USED',
          amount: card.stampsRequired,
          description: `Main reward claimed: ${card.template?.rewardTitle || 'Reward'}`,
          balanceBefore: card.stampsCollected,
          balanceAfter: 0,
          referenceId: claimed.id,
          referenceType: 'STAMP_CARD_REWARD',
          ...optionalMerchantStoreIdOnClaim(input.storeId),
        },
      })
      await touchUserMerchantActivity(tx, { userId: card.userId, merchantId: card.merchantId })
      await tx.loyaltyStampCard.update({
        where: { id: card.id },
        data: { stampsUsed: card.stampsRequired, isActive: false },
      })
    }

    return claimedAt
  }

  private async claimStreakReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
      sourceSubEntityId: string
    },
    storeId?: string
  ): Promise<Date> {
    const program = await tx.streakProgram.findUnique({
      where: { id: userReward.sourceEntityId },
      include: { stages: { orderBy: { dayThreshold: 'asc' } } },
    })
    if (!program || program.deletedAt) {
      throw new ErrorWithStatus(404, 'Streak program not found')
    }

    const state = await tx.userStreakState.findUnique({
      where: {
        UniqueUserStreakState: {
          userId: userReward.userId,
          streakProgramId: program.id,
        },
      },
    })
    if (!state || state.claimableRewardsCount < 1) {
      throw new ErrorWithStatus(409, 'No claimable streak rewards')
    }

    const stages: StageSnapshot[] =
      program.stages.length > 0
        ? program.stages.map((stage) => ({
            id: stage.id,
            dayThreshold: stage.dayThreshold,
            benefitType: stage.benefitType,
            rewardId: stage.rewardId ?? undefined,
            infoMessage: stage.infoMessage ?? undefined,
            pointsMultiplier: stage.pointsMultiplier ?? undefined,
            pointsAmount: stage.pointsAmount ?? undefined,
          }))
        : [
            {
              dayThreshold: program.requiredConsecutiveDays,
              benefitType: program.rewardId ? 'REWARD' : 'INFO_ONLY',
              rewardId: program.rewardId ?? undefined,
              infoMessage: program.rewardId ? undefined : 'Streak completed',
            },
          ]

    const nextClaim = resolveNextClaimableStage({
      currentStreak: state.currentStreak,
      claimedRewardsCount: state.claimedCycles,
      stages,
      repeatable: program.repeatable,
    })
    if (!nextClaim) {
      throw new ErrorWithStatus(409, 'No claimable streak rewards')
    }

    const expectedSourceSubEntityId = `${nextClaim.stage.id ?? nextClaim.stage.dayThreshold}:${nextClaim.cycleNumber}`
    if (expectedSourceSubEntityId !== userReward.sourceSubEntityId) {
      throw new ErrorWithStatus(409, 'Selected streak reward is no longer claimable')
    }

    await tx.userStreakState.update({
      where: { id: state.id },
      data: {
        claimableRewardsCount: state.claimableRewardsCount - 1,
        claimedCycles: state.claimedCycles + 1,
      },
    })

    if (
      nextClaim.stage.benefitType === StreakBenefitType.FIXED_POINTS &&
      nextClaim.stage.pointsAmount !== undefined &&
      nextClaim.stage.pointsAmount > 0
    ) {
      const userBalance = await tx.userMerchantPointBalance.findUnique({
        where: {
          userId_merchantId: {
            userId: userReward.userId,
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
            userId: userReward.userId,
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
          userId: userReward.userId,
          merchantId: program.merchantId,
          type: 'BONUS',
          amount: pointsToAdd,
          description: `Streak reward: ${program.name}`,
          referenceId: program.id,
          referenceType: 'STREAK_PROGRAM',
          balanceBefore,
          balanceAfter,
          ...optionalMerchantStoreIdOnClaim(storeId),
        },
      })
      await touchUserMerchantActivity(tx, { userId: userReward.userId, merchantId: program.merchantId })
    }

    const rewardClaim = await tx.streakRewardClaim.create({
      data: {
        userId: userReward.userId,
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

    return rewardClaim.claimedAt
  }

  private async claimCouponReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    },
    storeId?: string
  ): Promise<Date> {
    const coupon = await tx.coupon.findUnique({
      where: { id: userReward.sourceEntityId },
    })
    if (!coupon) {
      throw new ErrorWithStatus(404, 'Coupon not found')
    }

    if (storeId) {
      const store = await tx.merchantStore.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      })
      if (!store || store.merchantId !== coupon.merchantId) {
        throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
      }
    }

    const override = storeId
      ? await tx.couponStoreOverride.findUnique({
          where: {
            UniqueCouponStoreOverride: {
              couponId: coupon.id,
              merchantStoreId: storeId,
            },
          },
        })
      : null

    const effective = mergePrismaCouponWithOverride(coupon, override)

    const user = await tx.user.findUnique({
      where: { id: userReward.userId },
      select: { birthDate: true },
    })

    const now = new Date()
    assertCouponClaimAllowed({
      userId: userReward.userId,
      birthDate: user?.birthDate ?? null,
      now,
      baseCurrentUses: coupon.currentUses,
      effective,
    })

    const existingUserCoupon = await tx.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId: userReward.userId,
          couponId: coupon.id,
        },
      },
    })
    if (existingUserCoupon) {
      throw new ErrorWithStatus(409, 'You already have this coupon')
    }

    const activeUserCoupons = await tx.userCoupon.findMany({
      where: {
        userId: userReward.userId,
        isUsed: false,
        couponId: { not: coupon.id },
        coupon: {
          merchantId: coupon.merchantId,
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      },
      include: {
        coupon: {
          select: {
            isStackable: true,
            exclusivityGroups: true,
          },
        },
      },
    })

    UserRewardTransitionService.validateCouponCompatibility(
      {
        isStackable: effective.isStackable,
        exclusivityGroups: effective.exclusivityGroups,
      },
      activeUserCoupons.map((userCoupon) => ({
        isStackable: userCoupon.coupon.isStackable,
        exclusivityGroups: userCoupon.coupon.exclusivityGroups,
      }))
    )

    if (effective.availability === 'POINTS' && effective.pointsCost && effective.pointsCost > 0) {
      const balance = await tx.userMerchantPointBalance.findUnique({
        where: {
          userId_merchantId: {
            userId: userReward.userId,
            merchantId: coupon.merchantId,
          },
        },
      })
      const availablePoints = balance?.availablePoints ?? 0
      if (availablePoints < effective.pointsCost) {
        throw new ErrorWithStatus(
          400,
          `Insufficient points. You need ${effective.pointsCost}, but you have ${availablePoints}`
        )
      }

      if (!balance) {
        throw new ErrorWithStatus(
          400,
          `Insufficient points. You need ${effective.pointsCost}, but you have ${availablePoints}`
        )
      }

      const updatedBalance = await tx.userMerchantPointBalance.update({
        where: { id: balance.id },
        data: {
          availablePoints: { decrement: effective.pointsCost },
        },
      })

      await tx.merchantPointTransaction.create({
        data: {
          userId: userReward.userId,
          merchantId: coupon.merchantId,
          type: 'SPENT',
          amount: -effective.pointsCost,
          description: `Coupon: ${effective.title}`,
          referenceId: coupon.id,
          referenceType: 'COUPON',
          balanceBefore: availablePoints,
          balanceAfter: updatedBalance.availablePoints,
          ...optionalMerchantStoreIdOnClaim(storeId),
        },
      })
      await touchUserMerchantActivity(tx, { userId: userReward.userId, merchantId: coupon.merchantId })
    }

    const userCoupon = await tx.userCoupon.create({
      data: {
        userId: userReward.userId,
        couponId: coupon.id,
        isUsed: false,
      },
    })

    return userCoupon.createdAt
  }

  private async claimPointVoucherReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    }
  ): Promise<Date> {
    const voucher = await tx.pointVoucher.findUnique({
      where: { id: userReward.sourceEntityId },
    })
    if (!voucher || !voucher.isActive) {
      throw new ErrorWithStatus(404, 'Voucher does not exist or is inactive')
    }
    if (voucher.currentUses >= voucher.maxUses) {
      throw new ErrorWithStatus(410, 'Voucher has already been used the maximum number of times')
    }

    const now = new Date()
    if (voucher.validFrom && voucher.validFrom > now) {
      throw new ErrorWithStatus(400, 'Voucher is not yet valid')
    }
    if (voucher.validUntil && voucher.validUntil < now) {
      throw new ErrorWithStatus(410, 'Voucher has already expired')
    }

    const userBalance = await tx.userPointBalance.findUnique({
      where: { userId: userReward.userId },
    })
    if (!userBalance) {
      throw new ErrorWithStatus(400, 'You do not have any points in your account yet')
    }
    if (userBalance.availablePoints < voucher.pointsCost) {
      throw new ErrorWithStatus(
        400,
        `Insufficient points. You need ${voucher.pointsCost}, but you have ${userBalance.availablePoints}`
      )
    }

    const balanceBefore = userBalance.availablePoints
    const balanceAfter = balanceBefore - voucher.pointsCost
    const validUntil = voucher.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const qrCode = uuidv4()

    await tx.pointTransaction.create({
      data: {
        id: uuidv4(),
        userId: userReward.userId,
        type: TransactionType.SPENT,
        amount: -voucher.pointsCost,
        description: `Zakup vouchera: ${voucher.title}`,
        referenceId: voucher.id,
        referenceType: 'POINT_VOUCHER',
        balanceBefore,
        balanceAfter,
      },
    })

    await tx.userPointBalance.update({
      where: { userId: userReward.userId },
      data: {
        availablePoints: { decrement: voucher.pointsCost },
      },
    })

    const userVoucher = await tx.userPointVoucher.create({
      data: {
        userId: userReward.userId,
        pointVoucherId: voucher.id,
        qrCode,
        validUntil,
      },
    })

    await tx.pointVoucher.update({
      where: { id: voucher.id },
      data: { currentUses: { increment: 1 } },
    })

    return userVoucher.createdAt
  }

  private async claimMerchantVoucherReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    },
    storeId?: string
  ): Promise<Date> {
    const merchantVoucher = await tx.merchantVoucher.findUnique({
      where: { id: userReward.sourceEntityId },
      include: { merchant: true },
    })
    if (!merchantVoucher || !merchantVoucher.isActive) {
      throw new ErrorWithStatus(404, 'Merchant voucher not found or inactive')
    }
    if (merchantVoucher.validUntil && new Date() > merchantVoucher.validUntil) {
      throw new ErrorWithStatus(400, 'Merchant voucher has expired')
    }

    const balance = await tx.userMerchantPointBalance.findUnique({
      where: {
        userId_merchantId: {
          userId: userReward.userId,
          merchantId: merchantVoucher.merchantId,
        },
      },
    })
    const availablePoints = balance?.availablePoints ?? 0
    if (availablePoints < merchantVoucher.pointsCost) {
      throw new ErrorWithStatus(
        400,
        `Insufficient points. You have ${availablePoints}, need ${merchantVoucher.pointsCost}`
      )
    }

    if (!balance) {
      throw new ErrorWithStatus(
        400,
        `Insufficient points. You have ${availablePoints}, need ${merchantVoucher.pointsCost}`
      )
    }

    const updatedBalance = await tx.userMerchantPointBalance.update({
      where: { id: balance.id },
      data: {
        availablePoints: { decrement: merchantVoucher.pointsCost },
      },
    })

    await tx.merchantPointTransaction.create({
      data: {
        userId: userReward.userId,
        merchantId: merchantVoucher.merchantId,
        type: 'SPENT',
        amount: -merchantVoucher.pointsCost,
        description: `Merchant Voucher: ${merchantVoucher.title}`,
        referenceId: merchantVoucher.id,
        referenceType: 'MERCHANT_VOUCHER',
        balanceBefore: availablePoints,
        balanceAfter: updatedBalance.availablePoints,
        ...optionalMerchantStoreIdOnClaim(storeId),
      },
    })
    await touchUserMerchantActivity(tx, {
      userId: userReward.userId,
      merchantId: merchantVoucher.merchantId,
    })

    const qrCode = `MV-${uuidv4()}`
    const validUntil = merchantVoucher.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const userVoucher = await tx.userMerchantVoucher.create({
      data: {
        userId: userReward.userId,
        merchantVoucherId: merchantVoucher.id,
        qrCode,
        isUsed: false,
        validUntil,
      },
    })

    await tx.voucherHistory.create({
      data: {
        userId: userReward.userId,
        voucherType: 'MERCHANT_VOUCHER',
        voucherId: userVoucher.id,
        voucherCode: qrCode,
        voucherTitle: merchantVoucher.title,
        action: 'PURCHASED',
        pointsSpent: merchantVoucher.pointsCost,
        metadata: {
          merchantId: merchantVoucher.merchantId,
          merchantName: merchantVoucher.merchant.name,
        },
      },
    })

    return userVoucher.createdAt
  }

  private async redeemStampReward(
    tx: Prisma.TransactionClient,
    userReward: {
      sourceType: UserRewardSourceType
      sourceEntityId: string
      sourceSubEntityId: string
    },
    redeemedAt: Date
  ): Promise<void> {
    const milestoneId =
      userReward.sourceType === UserRewardSourceType.STAMP_MILESTONE ? userReward.sourceSubEntityId : null
    const claimedMilestone = await tx.claimedMilestone.findFirst({
      where: {
        cardId: userReward.sourceEntityId,
        milestoneId,
      },
    })
    if (!claimedMilestone) {
      throw new ErrorWithStatus(404, 'Claimed milestone not found')
    }
    if (claimedMilestone.isRedeemed) {
      throw new ErrorWithStatus(409, 'Reward already redeemed')
    }

    await tx.claimedMilestone.update({
      where: { id: claimedMilestone.id },
      data: { isRedeemed: true, redeemedAt },
    })
  }

  private async redeemCouponReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    },
    redeemedAt: Date,
    storeId: string
  ): Promise<void> {
    const userCoupon = await tx.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId: userReward.userId,
          couponId: userReward.sourceEntityId,
        },
      },
      include: { coupon: true },
    })
    if (!userCoupon) {
      throw new ErrorWithStatus(404, 'User coupon not found')
    }

    const store = await tx.merchantStore.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    })
    if (!store || store.merchantId !== userCoupon.coupon.merchantId) {
      throw new ErrorWithStatus(400, 'Store does not belong to coupon merchant')
    }

    const override = await tx.couponStoreOverride.findUnique({
      where: {
        UniqueCouponStoreOverride: {
          couponId: userCoupon.couponId,
          merchantStoreId: storeId,
        },
      },
    })

    const redeemer = await tx.user.findUnique({
      where: { id: userReward.userId },
      select: { birthDate: true },
    })

    await applyCouponRedemptionInTransaction(tx, {
      userCoupon,
      storeId,
      override,
      birthDate: redeemer?.birthDate ?? null,
      redeemedAt,
    })
  }

  private async redeemPointVoucherReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    },
    redeemedAt: Date
  ): Promise<void> {
    const voucher = await tx.userPointVoucher.findFirst({
      where: {
        userId: userReward.userId,
        pointVoucherId: userReward.sourceEntityId,
        isUsed: false,
      },
      orderBy: { createdAt: 'asc' },
    })
    if (!voucher) {
      throw new ErrorWithStatus(404, 'User point voucher not found')
    }
    await tx.userPointVoucher.update({
      where: { id: voucher.id },
      data: { isUsed: true, usedAt: redeemedAt },
    })
  }

  private async redeemMerchantVoucherReward(
    tx: Prisma.TransactionClient,
    userReward: {
      userId: string
      sourceEntityId: string
    },
    redeemedAt: Date
  ): Promise<void> {
    const voucher = await tx.userMerchantVoucher.findFirst({
      where: {
        userId: userReward.userId,
        merchantVoucherId: userReward.sourceEntityId,
        isUsed: false,
      },
      orderBy: { createdAt: 'asc' },
    })
    if (!voucher) {
      throw new ErrorWithStatus(404, 'User merchant voucher not found')
    }
    await tx.userMerchantVoucher.update({
      where: { id: voucher.id },
      data: { isUsed: true, usedAt: redeemedAt },
    })
  }
}
