import { Prisma, PrismaClient, UserRewardSourceType, UserRewardStatus } from '@prisma/client'
import { resolveNextClaimableStage, StageSnapshot, StreakBenefitTypeValue } from '../../Streak/service/StreakDomain'

type UpsertUserRewardInput = {
  userId: string
  sourceType: UserRewardSourceType
  sourceEntityId: string
  sourceSubEntityId?: string
  status: UserRewardStatus
  title: string
  description?: string
  merchantId?: string
  rewardId?: string
  availableAt?: Date
  claimedAt?: Date
  redeemedAt?: Date
  expiresAt?: Date
  pointsCost?: number
  qrCode?: string
  payload?: Prisma.InputJsonValue
}

type SourceKey = {
  userId: string
  sourceType: UserRewardSourceType
  sourceEntityId: string
  sourceSubEntityId?: string
}

export class UserRewardService {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) {}

  private normalizeSourceSubEntityId(value?: string): string {
    return value ?? ''
  }

  private shouldCreateStreakUserReward(benefitType: StreakBenefitTypeValue): boolean {
    return benefitType !== 'POINTS_MULTIPLIER' && benefitType !== 'FIXED_POINTS'
  }

  async upsertReward(input: UpsertUserRewardInput): Promise<void> {
    await this.prisma.userReward.upsert({
      where: {
        UniqueUserRewardSource: {
          userId: input.userId,
          sourceType: input.sourceType,
          sourceEntityId: input.sourceEntityId,
          sourceSubEntityId: this.normalizeSourceSubEntityId(input.sourceSubEntityId),
        },
      },
      create: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceEntityId: input.sourceEntityId,
        sourceSubEntityId: this.normalizeSourceSubEntityId(input.sourceSubEntityId),
        status: input.status,
        title: input.title,
        description: input.description,
        merchantId: input.merchantId,
        rewardId: input.rewardId,
        availableAt: input.availableAt,
        claimedAt: input.claimedAt,
        redeemedAt: input.redeemedAt,
        expiresAt: input.expiresAt,
        pointsCost: input.pointsCost,
        qrCode: input.qrCode,
        payload: input.payload,
      },
      update: {
        status: input.status,
        title: input.title,
        description: input.description,
        merchantId: input.merchantId,
        rewardId: input.rewardId,
        availableAt: input.availableAt,
        claimedAt: input.claimedAt,
        redeemedAt: input.redeemedAt,
        expiresAt: input.expiresAt,
        pointsCost: input.pointsCost,
        qrCode: input.qrCode,
        payload: input.payload,
      },
    })
  }

  async markClaimed(key: SourceKey, claimedAt = new Date()): Promise<void> {
    await this.prisma.userReward.update({
      where: {
        UniqueUserRewardSource: {
          userId: key.userId,
          sourceType: key.sourceType,
          sourceEntityId: key.sourceEntityId,
          sourceSubEntityId: this.normalizeSourceSubEntityId(key.sourceSubEntityId),
        },
      },
      data: {
        status: UserRewardStatus.CLAIMED,
        claimedAt,
      },
    })
  }

  async markRedeemed(key: SourceKey, redeemedAt = new Date()): Promise<void> {
    await this.prisma.userReward.update({
      where: {
        UniqueUserRewardSource: {
          userId: key.userId,
          sourceType: key.sourceType,
          sourceEntityId: key.sourceEntityId,
          sourceSubEntityId: this.normalizeSourceSubEntityId(key.sourceSubEntityId),
        },
      },
      data: {
        status: UserRewardStatus.REDEEMED,
        redeemedAt,
      },
    })
  }

  async markCancelled(key: SourceKey): Promise<void> {
    await this.prisma.userReward.update({
      where: {
        UniqueUserRewardSource: {
          userId: key.userId,
          sourceType: key.sourceType,
          sourceEntityId: key.sourceEntityId,
          sourceSubEntityId: this.normalizeSourceSubEntityId(key.sourceSubEntityId),
        },
      },
      data: {
        status: UserRewardStatus.CANCELLED,
      },
    })
  }

  async refreshAvailableRewardsForUser(userId: string, merchantIds?: string[]): Promise<void> {
    await this.prisma.userReward.updateMany({
      where: {
        userId,
        status: { in: [UserRewardStatus.AVAILABLE, UserRewardStatus.CLAIMED] },
        expiresAt: { lt: new Date() },
      },
      data: { status: UserRewardStatus.EXPIRED },
    })
    await this.syncAvailableStampRewards(userId, merchantIds)
    await this.syncAvailableStreakRewards(userId, merchantIds)
    await this.syncAvailableCoupons(userId, merchantIds)
    await this.syncAvailablePointVouchers(userId)
    await this.syncAvailableMerchantVouchers(userId, merchantIds)
  }

  async backfillForUser(userId: string, merchantIds?: string[]): Promise<void> {
    const claimedMilestones = await this.prisma.claimedMilestone.findMany({
      where: {
        card: {
          userId,
          ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
        },
      },
      include: {
        milestone: { include: { reward: true } },
        card: { include: { template: true } },
      },
    })
    for (const claim of claimedMilestones) {
      await this.upsertReward({
        userId,
        sourceType: claim.milestoneId ? UserRewardSourceType.STAMP_MILESTONE : UserRewardSourceType.STAMP_MAIN,
        sourceEntityId: claim.cardId,
        sourceSubEntityId: claim.milestoneId ?? undefined,
        status: claim.isRedeemed ? UserRewardStatus.REDEEMED : UserRewardStatus.CLAIMED,
        title:
          claim.milestone?.reward?.title ??
          claim.milestone?.title ??
          claim.card.template?.rewardTitle ??
          'Stamp reward',
        description:
          claim.milestone?.reward?.description ??
          claim.milestone?.description ??
          claim.card.template?.rewardDescription ??
          undefined,
        merchantId: claim.card.merchantId,
        rewardId: claim.milestone?.rewardId ?? claim.card.template?.rewardId ?? undefined,
        claimedAt: claim.claimedAt,
        redeemedAt: claim.redeemedAt ?? undefined,
      })
    }

    const streakClaims = await this.prisma.streakRewardClaim.findMany({
      where: {
        userId,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      include: {
        reward: true,
        streakProgram: true,
        streakStage: true,
      },
    })
    for (const claim of streakClaims) {
      if (!this.shouldCreateStreakUserReward(claim.benefitType)) {
        continue
      }

      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.STREAK,
        sourceEntityId: claim.streakProgramId,
        sourceSubEntityId: `${claim.streakStageId ?? 'legacy'}:${claim.cycleNumber}`,
        status: UserRewardStatus.CLAIMED,
        title: claim.reward?.title ?? claim.infoMessage ?? claim.streakProgram.name,
        description: claim.reward?.description ?? claim.infoMessage ?? claim.streakProgram.description ?? undefined,
        merchantId: claim.merchantId,
        rewardId: claim.rewardId ?? undefined,
        claimedAt: claim.claimedAt,
        payload: {
          cycleNumber: claim.cycleNumber,
          dayThreshold: claim.streakStage?.dayThreshold ?? undefined,
        },
      })
    }

    const userCoupons = await this.prisma.userCoupon.findMany({
      where: {
        userId,
        coupon: {
          ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
        },
      },
      include: {
        coupon: { include: { reward: true } },
      },
    })
    for (const userCoupon of userCoupons) {
      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.COUPON,
        sourceEntityId: userCoupon.couponId,
        status: userCoupon.isUsed ? UserRewardStatus.REDEEMED : UserRewardStatus.CLAIMED,
        title: userCoupon.coupon.reward?.title ?? userCoupon.coupon.title,
        description: userCoupon.coupon.reward?.description ?? userCoupon.coupon.description ?? undefined,
        merchantId: userCoupon.coupon.merchantId,
        rewardId: userCoupon.coupon.rewardId ?? undefined,
        claimedAt: userCoupon.createdAt,
        redeemedAt: userCoupon.usedAt ?? undefined,
        expiresAt: userCoupon.coupon.validUntil,
        pointsCost: userCoupon.coupon.pointsCost ?? undefined,
        qrCode: userCoupon.qrCode,
      })
    }

    const userPointVouchers = await this.prisma.userPointVoucher.findMany({
      where: { userId },
      include: { pointVoucher: true },
    })
    for (const userVoucher of userPointVouchers) {
      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.POINT_VOUCHER,
        sourceEntityId: userVoucher.pointVoucherId,
        status: userVoucher.isUsed ? UserRewardStatus.REDEEMED : UserRewardStatus.CLAIMED,
        title: userVoucher.pointVoucher.title,
        description: userVoucher.pointVoucher.description ?? undefined,
        claimedAt: userVoucher.createdAt,
        redeemedAt: userVoucher.usedAt ?? undefined,
        expiresAt: userVoucher.validUntil,
        pointsCost: userVoucher.pointVoucher.pointsCost,
        qrCode: userVoucher.qrCode,
      })
    }

    const userMerchantVouchers = await this.prisma.userMerchantVoucher.findMany({
      where: {
        userId,
        ...(merchantIds ? { merchantVoucher: { merchantId: { in: merchantIds } } } : {}),
      },
      include: { merchantVoucher: true },
    })
    for (const userVoucher of userMerchantVouchers) {
      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.MERCHANT_VOUCHER,
        sourceEntityId: userVoucher.merchantVoucherId,
        status: userVoucher.isUsed ? UserRewardStatus.REDEEMED : UserRewardStatus.CLAIMED,
        title: userVoucher.merchantVoucher.title,
        description: userVoucher.merchantVoucher.description ?? undefined,
        merchantId: userVoucher.merchantVoucher.merchantId,
        claimedAt: userVoucher.createdAt,
        redeemedAt: userVoucher.usedAt ?? undefined,
        expiresAt: userVoucher.validUntil,
        pointsCost: userVoucher.merchantVoucher.pointsCost,
        qrCode: userVoucher.qrCode,
      })
    }

    await this.refreshAvailableRewardsForUser(userId, merchantIds)
  }

  private async syncAvailableStampRewards(userId: string, merchantIds?: string[]): Promise<void> {
    const cards = await this.prisma.loyaltyStampCard.findMany({
      where: {
        userId,
        isActive: true,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      include: {
        merchant: true,
        template: {
          include: {
            reward: true,
            milestones: { include: { reward: true } },
          },
        },
        claimedMilestones: true,
      },
    })

    const eligibleStampKeys = new Set<string>()

    const stampEligibilityKey = (
      sourceType: UserRewardSourceType,
      sourceEntityId: string,
      sourceSubEntityId: string
    ): string => `${sourceType}:${sourceEntityId}:${sourceSubEntityId}`

    for (const card of cards) {
      if (card.stampsCollected >= card.stampsRequired && card.stampsUsed < card.stampsRequired) {
        eligibleStampKeys.add(
          stampEligibilityKey(UserRewardSourceType.STAMP_MAIN, card.id, this.normalizeSourceSubEntityId(undefined))
        )
        const title =
          card.template?.reward?.title ?? card.template?.rewardTitle ?? card.template?.title ?? 'Stamp reward'
        const description =
          card.template?.reward?.description ??
          card.template?.rewardDescription ??
          card.template?.description ??
          undefined
        await this.upsertReward({
          userId,
          sourceType: UserRewardSourceType.STAMP_MAIN,
          sourceEntityId: card.id,
          status: UserRewardStatus.AVAILABLE,
          title,
          description,
          merchantId: card.merchantId,
          rewardId: card.template?.rewardId ?? undefined,
          availableAt: new Date(),
        })
      }

      for (const milestone of card.template?.milestones ?? []) {
        const alreadyClaimed = card.claimedMilestones.some(
          (claimed: { milestoneId: string | null }) => claimed.milestoneId === milestone.id
        )
        if (!alreadyClaimed && milestone.isActive && card.stampsCollected >= milestone.stampsRequired) {
          eligibleStampKeys.add(stampEligibilityKey(UserRewardSourceType.STAMP_MILESTONE, card.id, milestone.id))
          const title = milestone.reward?.title ?? milestone.title
          const description = milestone.reward?.description ?? milestone.description ?? undefined
          await this.upsertReward({
            userId,
            sourceType: UserRewardSourceType.STAMP_MILESTONE,
            sourceEntityId: card.id,
            sourceSubEntityId: milestone.id,
            status: UserRewardStatus.AVAILABLE,
            title,
            description,
            merchantId: card.merchantId,
            rewardId: milestone.rewardId ?? undefined,
            availableAt: new Date(),
          })
        }
      }
    }

    const staleWhere: Prisma.UserRewardWhereInput = {
      userId,
      status: UserRewardStatus.AVAILABLE,
      sourceType: { in: [UserRewardSourceType.STAMP_MAIN, UserRewardSourceType.STAMP_MILESTONE] },
      ...(merchantIds && merchantIds.length > 0 ? { merchantId: { in: merchantIds } } : {}),
    }

    const staleAvailable = await this.prisma.userReward.findMany({
      where: staleWhere,
      select: { sourceType: true, sourceEntityId: true, sourceSubEntityId: true },
    })

    for (const row of staleAvailable) {
      const sub = this.normalizeSourceSubEntityId(row.sourceSubEntityId)
      const key = stampEligibilityKey(row.sourceType, row.sourceEntityId, sub)
      if (!eligibleStampKeys.has(key)) {
        await this.markCancelled({
          userId,
          sourceType: row.sourceType,
          sourceEntityId: row.sourceEntityId,
          sourceSubEntityId: row.sourceSubEntityId || undefined,
        })
      }
    }
  }

  private async syncAvailableStreakRewards(userId: string, merchantIds?: string[]): Promise<void> {
    const programs = await this.prisma.streakProgram.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      include: {
        merchant: true,
        reward: true,
        stages: {
          include: { reward: true },
          orderBy: { dayThreshold: 'asc' },
        },
        states: {
          where: { userId },
          take: 1,
        },
      },
    })

    for (const program of programs) {
      const state = program.states[0]
      if (!state || state.claimableRewardsCount < 1) {
        continue
      }

      const stages =
        program.stages.length > 0
          ? program.stages.map(
              (stage: {
                id: string
                dayThreshold: number
                benefitType: 'REWARD' | 'INFO_ONLY' | 'POINTS_MULTIPLIER' | 'FIXED_POINTS'
                rewardId: string | null
                infoMessage: string | null
                pointsMultiplier: number | null
                pointsAmount: number | null
              }) => ({
                id: stage.id,
                dayThreshold: stage.dayThreshold,
                benefitType: stage.benefitType,
                rewardId: stage.rewardId ?? undefined,
                infoMessage: stage.infoMessage ?? undefined,
                pointsMultiplier: stage.pointsMultiplier ?? undefined,
                pointsAmount: stage.pointsAmount ?? undefined,
              })
            )
          : (() => {
              const fallback: StageSnapshot = {
                dayThreshold: program.requiredConsecutiveDays,
                benefitType: program.rewardId ? 'REWARD' : 'INFO_ONLY',
                rewardId: program.rewardId ?? undefined,
                infoMessage: program.rewardId ? undefined : 'Streak completed',
              }
              return [fallback]
            })()

      for (let offset = 0; offset < state.claimableRewardsCount; offset++) {
        const nextClaim = resolveNextClaimableStage({
          currentStreak: state.currentStreak,
          claimedRewardsCount: state.claimedCycles + offset,
          stages,
          repeatable: program.repeatable,
        })
        if (!nextClaim) {
          continue
        }

        if (!this.shouldCreateStreakUserReward(nextClaim.stage.benefitType)) {
          continue
        }

        const stageRecord = program.stages.find(
          (stage: { id: string; reward: { title: string; description: string | null } | null }) =>
            stage.id === nextClaim.stage.id
        )
        const sourceSubEntityId = `${nextClaim.stage.id ?? nextClaim.stage.dayThreshold}:${
          state.claimedCycles + offset + 1
        }`
        const title = stageRecord?.reward?.title ?? nextClaim.stage.infoMessage ?? program.reward?.title ?? program.name
        const description =
          stageRecord?.reward?.description ?? program.reward?.description ?? program.description ?? undefined
        await this.upsertReward({
          userId,
          sourceType: UserRewardSourceType.STREAK,
          sourceEntityId: program.id,
          sourceSubEntityId,
          status: UserRewardStatus.AVAILABLE,
          title,
          description,
          merchantId: program.merchantId,
          rewardId: nextClaim.stage.rewardId ?? undefined,
          availableAt: new Date(),
          payload: {
            currentStreak: state.currentStreak,
            dayThreshold: nextClaim.stage.dayThreshold,
            cycleNumber: state.claimedCycles + offset + 1,
          },
        })
      }
    }
  }

  private async syncAvailableCoupons(userId: string, merchantIds?: string[]): Promise<void> {
    const balances = await this.prisma.userMerchantPointBalance.findMany({
      where: {
        userId,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
    })
    const pointsByMerchant = new Map<string, number>()
    for (const balance of balances) {
      pointsByMerchant.set(balance.merchantId, balance.availablePoints)
    }

    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        rewardId: { not: null },
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
      include: { reward: true, merchant: true },
    })
    const claimedCoupons = await this.prisma.userCoupon.findMany({
      where: { userId },
      select: { couponId: true },
    })
    const claimedCouponIds = new Set(claimedCoupons.map((coupon) => coupon.couponId))

    for (const coupon of coupons) {
      if (claimedCouponIds.has(coupon.id)) {
        continue
      }

      if (coupon.availability === 'POINTS') {
        const userPoints = pointsByMerchant.get(coupon.merchantId) ?? 0
        const cost = coupon.pointsCost ?? 0
        if (userPoints < cost) {
          continue
        }
      }

      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.COUPON,
        sourceEntityId: coupon.id,
        status: UserRewardStatus.AVAILABLE,
        title: coupon.reward?.title ?? coupon.title,
        description: coupon.reward?.description ?? coupon.description ?? undefined,
        merchantId: coupon.merchantId,
        rewardId: coupon.rewardId ?? undefined,
        availableAt: new Date(),
        pointsCost: coupon.pointsCost ?? undefined,
      })
    }
  }

  private async syncAvailablePointVouchers(userId: string): Promise<void> {
    const balance = await this.prisma.userPointBalance.findUnique({
      where: { userId },
    })
    const availablePoints = balance?.availablePoints ?? 0
    const pointVouchers = await this.prisma.pointVoucher.findMany({
      where: {
        isActive: true,
        pointsCost: { lte: availablePoints },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    })

    for (const voucher of pointVouchers) {
      await this.upsertReward({
        userId,
        sourceType: UserRewardSourceType.POINT_VOUCHER,
        sourceEntityId: voucher.id,
        status: UserRewardStatus.AVAILABLE,
        title: voucher.title,
        description: voucher.description ?? undefined,
        availableAt: new Date(),
        expiresAt: voucher.validUntil ?? undefined,
        pointsCost: voucher.pointsCost,
      })
    }
  }

  private async syncAvailableMerchantVouchers(userId: string, merchantIds?: string[]): Promise<void> {
    const balances = await this.prisma.userMerchantPointBalance.findMany({
      where: {
        userId,
        ...(merchantIds ? { merchantId: { in: merchantIds } } : {}),
      },
    })

    for (const balance of balances) {
      const vouchers = await this.prisma.merchantVoucher.findMany({
        where: {
          merchantId: balance.merchantId,
          isActive: true,
          pointsCost: { lte: balance.availablePoints },
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
        include: { merchant: true },
      })

      for (const voucher of vouchers) {
        await this.upsertReward({
          userId,
          sourceType: UserRewardSourceType.MERCHANT_VOUCHER,
          sourceEntityId: voucher.id,
          status: UserRewardStatus.AVAILABLE,
          title: voucher.title,
          description: voucher.description ?? undefined,
          merchantId: voucher.merchantId,
          availableAt: new Date(),
          expiresAt: voucher.validUntil ?? undefined,
          pointsCost: voucher.pointsCost,
        })
      }
    }
  }
}
