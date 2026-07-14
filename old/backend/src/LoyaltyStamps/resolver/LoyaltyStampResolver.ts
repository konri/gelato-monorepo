import { Resolver, Query, Mutation, Arg, Ctx, Authorized, Int } from 'type-graphql'
import { OperatorPermission } from '@prisma/client'
import { LoyaltyStampCard } from '../objectType/LoyaltyStampCard'
import { LoyaltyStampCardTemplate } from '../objectType/LoyaltyStampCardTemplate'
import { LoyaltyStamp } from '../objectType/LoyaltyStamp'
import { StampTransaction, StampTransactionType } from '../objectType/StampTransaction'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { StampIntegrityService } from '../service/StampIntegrityService'
import { assertValidStampTemplateDateRange } from '../service/stampTemplateSchedule'
import {
  buildAvailableStampTemplatesWhere,
  ensureStampTemplateUsableForCardActivation,
  resolveStampTemplateForEarn,
} from '../service/stampTemplateResolution'
import { Role } from '../../User/objectType/Role'
import { CreateStampCardTemplateInput } from '../inputType/CreateStampCardTemplateInput'
import { StampMilestone, RewardType, MilestoneType } from '../objectType/StampMilestone'
import { RewardSourceType, RewardValueType } from '../../Reward/objectType/Reward'
import { enrichCardWithRewards } from '../service/StampCardEnricher'
import { StreakAutomationService } from '../../Streak/service/StreakAutomationService'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { PushNotificationHelper } from '../../services/PushNotificationHelper'

@Resolver(() => LoyaltyStampCard)
export class LoyaltyStampResolver {
  private async resolveMerchantIdsForOperator(
    ctx: Context,
    requiredPermission?: OperatorPermission
  ): Promise<string[]> {
    const user = ctx.req.user!
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

  private async resolvePrimaryMerchantIdForOperator(ctx: Context): Promise<string | null> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return null
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    return merchantAccessService.resolvePrimaryMerchantId(user.id, user.roles)
  }

  private async ensureOperatorMerchantAccess(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'No access to this merchant')
    }
  }

  private async ensureCanEditStampTemplateBase(ctx: Context, merchantId: string): Promise<void> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return
    }
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const canEditBase = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.STAMP_TEMPLATE_BASE_WRITE
    )
    if (!canEditBase) {
      throw new ErrorWithStatus(403, 'No access to edit merchant-wide configuration (full merchant scope required)')
    }
  }

  // TEMPLATES - Zarządzanie szablonami kart pieczątek
  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [LoyaltyStampCardTemplate])
  async myStampCardTemplates(@Ctx() ctx: Context): Promise<LoyaltyStampCardTemplate[]> {
    const user = ctx.req.user!
    if (user.roles.includes(Role.ADMIN)) {
      return (await ctx.prisma.loyaltyStampCardTemplate.findMany({
        include: { merchant: true, stampCards: true, milestones: { include: { reward: true } }, reward: true },
      })) as LoyaltyStampCardTemplate[]
    }
    const merchantIds = await this.resolveMerchantIdsForOperator(ctx, OperatorPermission.STAMP_TEMPLATE_READ)

    return (await ctx.prisma.loyaltyStampCardTemplate.findMany({
      where: { merchantId: { in: merchantIds } },
      include: { merchant: true, stampCards: true, milestones: { include: { reward: true } }, reward: true },
    })) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => LoyaltyStampCardTemplate)
  async createStampCardTemplate(
    @Arg('data') data: CreateStampCardTemplateInput,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCardTemplate> {
    const {
      milestones,
      merchantId,
      rewardId,
      rewardType,
      rewardTitle,
      rewardDescription,
      rewardDiscountPercent,
      rewardDiscountAmount,
      rewardImageUrl,
      ...templateData
    } = data

    const user = ctx.req.user!
    if (!user.roles.includes(Role.ADMIN)) {
      await this.ensureOperatorMerchantAccess(ctx, merchantId)
      await this.ensureCanEditStampTemplateBase(ctx, merchantId)
    }

    assertValidStampTemplateDateRange(data.validFrom, data.validUntil)

    let finalRewardId = rewardId

    const hasLegacyRewardData = rewardTitle || rewardType || rewardDiscountPercent || rewardDiscountAmount
    if (!finalRewardId && hasLegacyRewardData) {
      const valueType = this.mapRewardTypeToValueType(rewardType)
      const rewardData = {
        merchantId,
        title: rewardTitle || data.title,
        description: rewardDescription ?? undefined,
        imageUrl: rewardImageUrl ?? undefined,
        sourceType: RewardSourceType.STAMP_CARD,
        valueType,
        discountPercent: rewardDiscountPercent ?? undefined,
        discountAmount: rewardDiscountAmount ?? undefined,
      }
      const reward = await ctx.prisma.reward.create({
        data: rewardData as Parameters<typeof ctx.prisma.reward.create>[0]['data'],
      })
      finalRewardId = reward.id
    }

    const template = await ctx.prisma.loyaltyStampCardTemplate.create({
      data: {
        ...templateData,
        merchantId,
        rewardId: finalRewardId,
        rewardType,
        rewardTitle,
        rewardDescription,
        rewardDiscountPercent,
        rewardDiscountAmount,
        rewardImageUrl,
      },
      include: { merchant: true, stampCards: true, milestones: { include: { reward: true } }, reward: true },
    })

    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        let milestoneRewardId = milestone.rewardId

        const hasLegacyMilestoneData =
          milestone.title ||
          milestone.milestoneType ||
          milestone.discountPercent ||
          milestone.discountAmount ||
          milestone.pointsReward
        if (!milestoneRewardId && hasLegacyMilestoneData) {
          const valueType = this.mapMilestoneTypeToValueType(milestone.milestoneType)
          const milestoneRewardData = {
            merchantId,
            title: milestone.title,
            description: milestone.description ?? undefined,
            imageUrl: milestone.imageUrl ?? undefined,
            sourceType: RewardSourceType.STAMP_CARD,
            valueType,
            discountPercent: milestone.discountPercent ?? undefined,
            discountAmount: milestone.discountAmount ?? undefined,
            pointsValue: milestone.pointsReward ?? undefined,
          }
          const milestoneReward = await ctx.prisma.reward.create({
            data: milestoneRewardData as Parameters<typeof ctx.prisma.reward.create>[0]['data'],
          })
          milestoneRewardId = milestoneReward.id
        }

        await ctx.prisma.stampMilestone.create({
          data: {
            templateId: template.id,
            stampsRequired: milestone.stampsRequired,
            rewardId: milestoneRewardId,
            milestoneType: milestone.milestoneType,
            discountPercent: milestone.discountPercent,
            discountAmount: milestone.discountAmount,
            pointsReward: milestone.pointsReward,
            imageUrl: milestone.imageUrl,
            title: milestone.title,
            description: milestone.description,
          },
        })
      }

      return (await ctx.prisma.loyaltyStampCardTemplate.findUnique({
        where: { id: template.id },
        include: { merchant: true, stampCards: true, milestones: { include: { reward: true } }, reward: true },
      })) as any
    }

    return template as any
  }

  private mapRewardTypeToValueType(rewardType?: RewardType): RewardValueType {
    switch (rewardType) {
      case RewardType.DISCOUNT_PERCENT:
        return RewardValueType.DISCOUNT_PERCENT
      case RewardType.DISCOUNT_AMOUNT:
        return RewardValueType.DISCOUNT_AMOUNT
      case RewardType.FREE_SERVICE:
      default:
        return RewardValueType.FREE_SERVICE
    }
  }

  private mapMilestoneTypeToValueType(milestoneType: MilestoneType): RewardValueType {
    switch (milestoneType) {
      case MilestoneType.DISCOUNT_PERCENT:
        return RewardValueType.DISCOUNT_PERCENT
      case MilestoneType.DISCOUNT_AMOUNT:
        return RewardValueType.DISCOUNT_AMOUNT
      case MilestoneType.POINTS_REWARD:
        return RewardValueType.POINTS
      case MilestoneType.FREE_SERVICE:
      default:
        return RewardValueType.FREE_SERVICE
    }
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => LoyaltyStampCardTemplate)
  async updateStampCardTemplate(
    @Arg('id', () => String) id: string,
    @Arg('data', () => CreateStampCardTemplateInput) data: CreateStampCardTemplateInput,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCardTemplate> {
    const template = await ctx.prisma.loyaltyStampCardTemplate.findUnique({
      where: { id },
      include: { merchant: true },
    })

    if (!template) throw new ErrorWithStatus(404, 'Template not found')

    // Sprawdź uprawnienia
    const user = ctx.req.user!
    if (!user.roles.includes(Role.ADMIN)) {
      await this.ensureOperatorMerchantAccess(ctx, template.merchantId)
      await this.ensureCanEditStampTemplateBase(ctx, template.merchantId)
    }

    const nextValidFrom = data.validFrom !== undefined ? data.validFrom : template.validFrom
    const nextValidUntil = data.validUntil !== undefined ? data.validUntil : template.validUntil
    assertValidStampTemplateDateRange(nextValidFrom ?? undefined, nextValidUntil ?? undefined)

    const { milestones, ...templateData } = data

    return (await ctx.prisma.loyaltyStampCardTemplate.update({
      where: { id },
      data: templateData,
      include: { merchant: true, stampCards: true, milestones: { include: { reward: true } }, reward: true },
    })) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteStampCardTemplate(@Arg('id', () => String) id: string, @Ctx() ctx: Context): Promise<boolean> {
    const template = await ctx.prisma.loyaltyStampCardTemplate.findUnique({
      where: { id },
      include: { stampCards: true },
    })

    if (!template) throw new ErrorWithStatus(404, 'Template not found')

    if (template.stampCards.length > 0) {
      throw new ErrorWithStatus(409, 'Cannot delete template with active cards')
    }

    // Sprawdź uprawnienia
    const user = ctx.req.user!
    if (!user.roles.includes(Role.ADMIN)) {
      await this.ensureOperatorMerchantAccess(ctx, template.merchantId)
      await this.ensureCanEditStampTemplateBase(ctx, template.merchantId)
    }

    await ctx.prisma.loyaltyStampCardTemplate.delete({ where: { id } })
    return true
  }

  // CARDS - Zarządzanie kartami użytkowników
  @Authorized([Role.CLIENT])
  @Mutation(() => LoyaltyStampCard)
  async activateStampCard(
    @Arg('merchantId', () => String) merchantId: string,
    @Arg('templateId', () => String, { nullable: true }) templateId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCard> {
    const userId = ctx.req.user!.id

    // Sprawdź czy użytkownik już ma aktywną kartę z wolnymi slotami
    const existingCards = await ctx.prisma.loyaltyStampCard.findMany({
      where: { userId, merchantId, isActive: true },
    })

    const hasUnfilledCard = existingCards.some((c) => c.stampsCollected < c.stampsRequired)
    if (hasUnfilledCard) {
      throw new ErrorWithStatus(409, 'User already has an active stamp card with available slots for this merchant')
    }

    let stampsRequired = 10 // domyślna wartość

    if (templateId) {
      const template = await ensureStampTemplateUsableForCardActivation(ctx.prisma, {
        templateId,
        merchantId,
      })
      stampsRequired = template.stampsRequired
    }

    const stampCard = await ctx.prisma.loyaltyStampCard.create({
      data: {
        userId,
        merchantId,
        templateId,
        stampsRequired,
      },
      include: {
        merchant: true,
        template: { include: { milestones: { include: { reward: true } }, reward: true } },
        stamps: true,
        transactions: true,
        claimedMilestones: true,
      },
    })

    // Award referral points for client activity (first stamp card activation)
    const { ReferralService } = await import('../../Referral/service/ReferralService')
    await ReferralService.awardReferralPoints(userId, 'CLIENT_ACTIVE')

    return (stampCard as unknown) as LoyaltyStampCard
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => LoyaltyStampCard)
  async activateOwnMerchantStampCard(
    @Arg('templateId', () => String, { nullable: true }) templateId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCard> {
    const userId = ctx.req.user!.id

    // Get merchantId from user's company
    const company = await ctx.prisma.company.findUnique({
      where: { userId },
      include: {
        merchant: true,
      },
    })

    if (!company?.merchant) {
      throw new ErrorWithStatus(404, 'Merchant not found for this user')
    }

    const merchantId = company.merchant.id

    // Sprawdź czy użytkownik już ma aktywną kartę z wolnymi slotami
    const existingCards = await ctx.prisma.loyaltyStampCard.findMany({
      where: { userId, merchantId, isActive: true },
    })

    const hasUnfilledCard = existingCards.some((c) => c.stampsCollected < c.stampsRequired)
    if (hasUnfilledCard) {
      throw new ErrorWithStatus(409, 'User already has an active stamp card with available slots for this merchant')
    }

    let stampsRequired = 10 // domyślna wartość

    if (templateId) {
      const template = await ensureStampTemplateUsableForCardActivation(ctx.prisma, {
        templateId,
        merchantId,
      })
      stampsRequired = template.stampsRequired
    }

    return ((await ctx.prisma.loyaltyStampCard.create({
      data: {
        userId,
        merchantId,
        templateId,
        stampsRequired,
      },
      include: {
        merchant: true,
        template: true,
        stamps: true,
        transactions: true,
      },
    })) as unknown) as LoyaltyStampCard
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => LoyaltyStampCard)
  async activateStampCardForUser(
    @Arg('userId', () => String) targetUserId: string,
    @Arg('merchantId', () => String) merchantId: string,
    @Arg('templateId', () => String, { nullable: true }) templateId: string | undefined,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCard> {
    const currentUser = ctx.req.user!

    // Sprawdź uprawnienia do merchanta
    if (!currentUser.roles.includes(Role.ADMIN)) {
      await this.ensureOperatorMerchantAccess(ctx, merchantId)
    }

    // Sprawdź czy użytkownik już ma aktywną kartę z wolnymi slotami
    const existingCards = await ctx.prisma.loyaltyStampCard.findMany({
      where: { userId: targetUserId, merchantId, isActive: true },
    })

    const hasUnfilledCard = existingCards.some((c) => c.stampsCollected < c.stampsRequired)
    if (hasUnfilledCard) {
      throw new ErrorWithStatus(409, 'User already has an active stamp card with available slots for this merchant')
    }

    // Sprawdź czy target user istnieje
    const targetUser = await ctx.prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      throw new ErrorWithStatus(404, 'Target user not found')
    }

    let stampsRequired = 10 // domyślna wartość

    if (templateId) {
      const template = await ensureStampTemplateUsableForCardActivation(ctx.prisma, {
        templateId,
        merchantId,
      })
      stampsRequired = template.stampsRequired
    }

    return (await ctx.prisma.loyaltyStampCard.create({
      data: {
        userId: targetUserId,
        merchantId,
        templateId,
        stampsRequired,
      },
      include: {
        merchant: true,
        template: true,
        stamps: true,
        transactions: true,
        user: true,
      },
    })) as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [LoyaltyStampCard])
  async myStampCards(@Ctx() ctx: Context): Promise<LoyaltyStampCard[]> {
    const cards = await ctx.prisma.loyaltyStampCard.findMany({
      where: { userId: ctx.req.user!.id },
      include: {
        merchant: true,
        template: { include: { milestones: { include: { reward: true } }, reward: true } },
        stamps: true,
        transactions: true,
        claimedMilestones: { include: { milestone: { include: { reward: true } } } },
      },
    })

    return cards.map((card: any) => enrichCardWithRewards(card)) as any
  }

  @Query(() => [LoyaltyStampCardTemplate])
  async availableStampCardTemplates(
    @Ctx() ctx: Context,
    @Arg('merchantId', () => String, { nullable: true }) merchantId?: string
  ): Promise<LoyaltyStampCardTemplate[]> {
    return (await ctx.prisma.loyaltyStampCardTemplate.findMany({
      where: buildAvailableStampTemplatesWhere({ merchantId }),
      include: { merchant: true, milestones: { include: { reward: true } }, reward: true },
    })) as LoyaltyStampCardTemplate[]
  }

  @Query(() => [LoyaltyStampCardTemplate])
  async allStampCardTemplates(@Ctx() ctx: Context): Promise<LoyaltyStampCardTemplate[]> {
    return (await ctx.prisma.loyaltyStampCardTemplate.findMany({
      include: { merchant: true, milestones: { include: { reward: true } }, reward: true },
    })) as LoyaltyStampCardTemplate[]
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => [LoyaltyStamp])
  async addStampByUserId(
    @Arg('userId', () => String) userId: string,
    @Arg('templateId', () => String, { nullable: true }) templateId: string | undefined,
    @Arg('description', () => String) description: string,
    @Arg('count', () => Int, { defaultValue: 1 }) count: number,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStamp[]> {
    const user = ctx.req.user!

    if (count < 1) throw new ErrorWithStatus(400, 'Count must be at least 1')

    const merchantId = await this.resolvePrimaryMerchantIdForOperator(ctx)
    if (!merchantId) throw new ErrorWithStatus(404, 'Merchant not found')

    const isEmail = userId.includes('@')
    const targetUser = await ctx.prisma.user.findFirst({
      where: isEmail ? { email: userId.toLowerCase().trim() } : { id: userId },
    })

    if (!targetUser) {
      throw new ErrorWithStatus(404, `User with ${isEmail ? 'email' : 'id'} ${userId} not found`)
    }

    const targetUserId = targetUser.id

    return ctx.prisma.$transaction(async (tx) => {
      const template = await resolveStampTemplateForEarn(tx, { merchantId, templateId })

      const getOrCreateCard = async () => {
        const existing = await tx.loyaltyStampCard.findFirst({
          where: { userId: targetUserId, merchantId, isActive: true },
          orderBy: { createdAt: 'desc' },
        })

        if (existing && existing.stampsCollected < existing.stampsRequired) {
          return existing
        }

        return tx.loyaltyStampCard.create({
          data: {
            userId: targetUserId,
            merchantId,
            templateId: template.id,
            stampsRequired: template.stampsRequired,
          },
        })
      }

      let remaining = count
      const allStamps: LoyaltyStamp[] = []

      while (remaining > 0) {
        let card = await getOrCreateCard()

        if (!card.templateId) {
          if (card.stampsCollected > template.stampsRequired) {
            throw new ErrorWithStatus(
              409,
              'This stamp card cannot be linked to the configured program. Contact support.'
            )
          }
          card = await tx.loyaltyStampCard.update({
            where: { id: card.id },
            data: { templateId: template.id, stampsRequired: template.stampsRequired },
          })
        }

        const slotsAvailable = card.stampsRequired - card.stampsCollected

        if (slotsAvailable <= 0) {
          throw new ErrorWithStatus(500, 'Unable to find or create a card with available slots')
        }

        const toAdd = Math.min(remaining, slotsAvailable)

        for (let i = 0; i < toAdd; i++) {
          const stamp = await tx.loyaltyStamp.create({
            data: {
              cardId: card.id,
              metadata: { addedBy: user.id },
            },
          })
          allStamps.push(stamp as LoyaltyStamp)
        }

        await tx.stampTransaction.create({
          data: {
            userId: targetUserId,
            cardId: card.id,
            type: StampTransactionType.EARNED,
            amount: toAdd,
            description,
            balanceBefore: card.stampsCollected,
            balanceAfter: card.stampsCollected + toAdd,
            referenceId: allStamps[allStamps.length - toAdd].id,
            referenceType: 'LOYALTY_STAMP',
            merchantStoreId: storeId,
          },
        })

        await tx.loyaltyStampCard.update({
          where: { id: card.id },
          data: { stampsCollected: { increment: toAdd } },
        })

        remaining -= toAdd
      }

      const streakAutomationService = new StreakAutomationService(ctx.prisma)
      await streakAutomationService.processVisitForMerchantAction({
        userId: targetUserId,
        merchantId,
        source: 'STAMP_EARNED',
        merchantStoreId: storeId,
      })

      const userRewardService = new UserRewardService(ctx.prisma)
      await userRewardService.refreshAvailableRewardsForUser(targetUserId, [merchantId])

      // Send push notification
      const merchant = await tx.merchant.findUnique({ where: { id: merchantId } })
      const finalCard = await tx.loyaltyStampCard.findFirst({
        where: { userId: targetUserId, merchantId, isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { template: { include: { reward: true } } },
      })

      if (merchant && finalCard) {
        // Check if card completed
        if (finalCard.stampsCollected >= finalCard.stampsRequired) {
          await PushNotificationHelper.sendStampCardCompleted({
            userId: targetUserId,
            merchantName: merchant.name,
            rewardTitle: finalCard.template?.reward?.title || finalCard.template?.rewardTitle || undefined,
            prisma: tx,
          })
        } else {
          // Regular stamp added
          await PushNotificationHelper.sendStampAdded({
            userId: targetUserId,
            merchantName: merchant.name,
            stampsCollected: finalCard.stampsCollected,
            stampsRequired: finalCard.stampsRequired,
            prisma: tx,
          })
        }
      }

      return allStamps
    })
  }

  @Authorized([Role.ADMIN])
  @Query(() => Boolean)
  async validateStampCardIntegrity(@Arg('cardId', () => String) cardId: string, @Ctx() ctx: Context): Promise<boolean> {
    const integrityService = new StampIntegrityService(ctx.prisma)
    return integrityService.validateStampCard(cardId)
  }

  @Authorized([Role.ADMIN])
  @Query(() => String)
  async getStampIntegrityReport(@Ctx() ctx: Context): Promise<string> {
    const integrityService = new StampIntegrityService(ctx.prisma)
    const report = await integrityService.getIntegrityReport()
    return JSON.stringify(report, null, 2)
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean)
  async fixStampCardDiscrepancy(@Arg('cardId', () => String) cardId: string, @Ctx() ctx: Context): Promise<boolean> {
    const integrityService = new StampIntegrityService(ctx.prisma)
    return integrityService.fixCardDiscrepancy(cardId)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [LoyaltyStampCard])
  async getUserStampCards(
    @Arg('userId', () => String) userId: string,
    @Ctx() ctx: Context
  ): Promise<LoyaltyStampCard[]> {
    const user = ctx.req.user!

    const isEmail = userId.includes('@')
    const targetUser = await ctx.prisma.user.findFirst({
      where: isEmail ? { email: userId.toLowerCase().trim() } : { id: userId },
    })

    if (!targetUser) {
      throw new ErrorWithStatus(404, `User with ${isEmail ? 'email' : 'id'} ${userId} not found`)
    }

    const stampCardInclude = {
      merchant: true,
      template: { include: { milestones: { include: { reward: true } }, reward: true } },
      stamps: true,
      claimedMilestones: { include: { milestone: { include: { reward: true } } } },
    }

    let cards: any[]

    if (user.roles.includes(Role.ADMIN)) {
      cards = await ctx.prisma.loyaltyStampCard.findMany({
        where: { userId: targetUser.id, isActive: true },
        include: stampCardInclude,
      })
    } else {
      const merchantIds = await this.resolveMerchantIdsForOperator(ctx, OperatorPermission.STAMP_TEMPLATE_READ)

      if (merchantIds.length === 0) {
        return []
      }

      cards = await ctx.prisma.loyaltyStampCard.findMany({
        where: { userId: targetUser.id, merchantId: { in: merchantIds }, isActive: true },
        include: stampCardInclude,
      })
    }

    return cards.map((card: any) => enrichCardWithRewards(card)) as any
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean)
  async deleteStampCard(@Arg('cardId', () => String) cardId: string, @Ctx() ctx: Context): Promise<boolean> {
    await ctx.prisma.loyaltyStampCard.delete({ where: { id: cardId } })
    return true
  }
}
