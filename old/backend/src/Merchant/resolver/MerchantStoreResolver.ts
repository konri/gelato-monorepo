import 'reflect-metadata'
import { Resolver, Query, Mutation, Ctx, Authorized, Arg } from 'type-graphql'
import { OperatorPermission } from '@prisma/client'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { MerchantStore } from '../objectType/MerchantStore'
import { StoreOffers } from '../objectType/StoreOffers'
import { CreateMerchantStoreInput } from '../DTO/CreateMerchantStoreInput'
import { UpdateMerchantStoreInput } from '../DTO/UpdateMerchantStoreInput'
import { StoreSearchInput } from '../DTO/StoreSearchInput'
import { MerchantStoreMapper } from '../../shared/mappers/MerchantStoreMapper'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

@Resolver()
export class MerchantStoreResolver {
  @Query(() => [MerchantStore])
  async getStoresForMap(
    @Ctx() ctx: Context,
    @Arg('latitude', { nullable: true }) latitude?: number,
    @Arg('longitude', { nullable: true }) longitude?: number,
    @Arg('radiusKm', { nullable: true }) radiusKm?: number
  ): Promise<MerchantStore[]> {
    const stores = await ctx.prisma.merchantStore.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        merchant: true,
        category: true,
        orderQueueConfig: true,
        merchantVouchers: {
          where: {
            isActive: true,
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const storesWithOffers = await Promise.all(
      stores.map(async (store) => {
        const [stampTemplates, coupons] = await Promise.all([
          ctx.prisma.loyaltyStampCardTemplate.findMany({
            where: {
              merchantId: store.merchantId,
              isActive: true,
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
            select: { id: true, title: true, stampsRequired: true, rewardTitle: true },
          }),
          ctx.prisma.coupon.findMany({
            where: {
              merchantId: store.merchantId,
              isActive: true,
              validFrom: { lte: new Date() },
              validUntil: { gte: new Date() },
            },
            select: { id: true, title: true, pointsCost: true, discountType: true, discountValue: true },
          }),
        ])

        const vouchers = store.merchantVouchers.map((v) => ({
          id: v.id,
          title: v.title,
          pointsCost: v.pointsCost,
          value: v.value,
        }))

        const stampCards = stampTemplates.map((t) => ({
          id: t.id,
          title: t.title,
          stampsRequired: t.stampsRequired,
          rewardTitle: t.rewardTitle,
        }))

        const couponsList = coupons.map((c) => ({
          id: c.id,
          title: c.title,
          pointsCost: c.pointsCost,
          discountType: c.discountType,
          discountValue: c.discountValue ? Math.round(c.discountValue) : null,
        }))

        const hasPromotions = vouchers.length > 0 || stampCards.length > 0 || couponsList.length > 0

        let distanceKm: number | undefined
        if (latitude && longitude && store.latitude && store.longitude) {
          distanceKm = calculateDistance(latitude, longitude, store.latitude, store.longitude)
        }

        return {
          ...store,
          distanceKm,
          availablePromotions: {
            hasPromotions,
            vouchers,
            stampCards,
            coupons: couponsList,
          },
        }
      })
    )

    let filteredStores = storesWithOffers
    if (latitude && longitude && radiusKm) {
      filteredStores = storesWithOffers.filter((s) => s.distanceKm !== undefined && s.distanceKm <= radiusKm)
    }

    if (latitude && longitude) {
      filteredStores.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
    }

    return MerchantStoreMapper.toGraphQLArray(filteredStores)
  }

  @Query(() => [MerchantStore])
  async getStores(
    @Ctx() ctx: Context,
    @Arg('filters', { nullable: true }) filters?: StoreSearchInput
  ): Promise<MerchantStore[]> {
    const { search, city, merchantId, page = 1, pageSize = 12 } = filters || {}
    const skip = (page - 1) * pageSize

    const where: any = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(city && {
        city: { contains: city, mode: 'insensitive' },
      }),
      ...(merchantId && { merchantId }),
    }

    const stores = await ctx.prisma.merchantStore.findMany({
      where,
      include: { merchant: true, orderQueueConfig: true },
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
    })

    return MerchantStoreMapper.toGraphQLArray(stores)
  }

  @Query(() => MerchantStore, { nullable: true })
  async getStore(@Ctx() ctx: Context, @Arg('id') id: string): Promise<MerchantStore | null> {
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id },
      include: { merchant: true, category: true, orderQueueConfig: true },
    })

    if (!store) {
      return null
    }

    // Build result with mapper first
    const result = MerchantStoreMapper.toGraphQL(store)

    // If user is logged in, fetch their personalized data
    if (ctx.req.user?.id) {
      const userId = ctx.req.user.id

      // Fetch user's stamp card for this merchant
      const stampCard = await ctx.prisma.loyaltyStampCard.findFirst({
        where: {
          userId,
          merchantId: store.merchantId,
          isActive: true,
        },
        include: {
          template: { include: { milestones: true } },
        },
      })

      if (stampCard?.template) {
        result.stampCard = {
          current: stampCard.stampsCollected,
          required: stampCard.stampsRequired,
          reward: stampCard.template.rewardTitle || 'Reward',
          isUsed: stampCard.stampsUsed > 0,
          isActive: stampCard.isActive,
          canRedeem: stampCard.stampsCollected >= stampCard.stampsRequired && stampCard.stampsUsed === 0,
        }
      } else {
        // Check if there's an available template for this merchant
        const availableTemplate = await ctx.prisma.loyaltyStampCardTemplate.findFirst({
          where: {
            merchantId: store.merchantId,
            isActive: true,
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
        })

        if (availableTemplate) {
          result.stampCard = {
            current: 0,
            required: availableTemplate.stampsRequired,
            reward: availableTemplate.rewardTitle || 'Reward',
            isUsed: false,
            isActive: false,
            canRedeem: false,
            canActivate: true,
            templateId: availableTemplate.id,
          }
        }
      }

      // Get merchant's thresholds
      const merchant = await ctx.prisma.merchant.findUnique({
        where: { id: store.merchantId },
        select: { rewardProximityThreshold: true, stampProximityThreshold: true },
      })

      const pointThreshold = merchant?.rewardProximityThreshold || 50
      const stampThreshold = merchant?.stampProximityThreshold || 2

      // Fetch user's merchant points for this merchant
      const pointBalance = await ctx.prisma.userMerchantPointBalance.findUnique({
        where: {
          userId_merchantId: {
            userId,
            merchantId: store.merchantId,
          },
        },
      })

      const redeemableRewards: any[] = []

      if (pointBalance) {
        result.userPoints = pointBalance.availablePoints

        // Fetch redeemable rewards (vouchers & coupons user can afford or is close to affording)
        const [redeemableVouchers, redeemableCoupons] = await Promise.all([
          ctx.prisma.merchantVoucher.findMany({
            where: {
              storeId: id,
              isActive: true,
              pointsCost: { lte: pointBalance.availablePoints + pointThreshold },
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
            orderBy: { pointsCost: 'asc' },
            take: 5,
          }),
          ctx.prisma.coupon.findMany({
            where: {
              merchantId: store.merchantId,
              isActive: true,
              pointsCost: { not: null, lte: pointBalance.availablePoints + pointThreshold },
              validFrom: { lte: new Date() },
              validUntil: { gte: new Date() },
            },
            orderBy: { pointsCost: 'asc' },
            take: 5,
          }),
        ])

        redeemableRewards.push(
          ...redeemableVouchers.map((v) => ({
            id: v.id,
            type: 'VOUCHER',
            title: v.title,
            description: v.description || undefined,
            imageUrl: v.imageUrl || undefined,
            pointsCost: v.pointsCost,
            userPoints: pointBalance.availablePoints,
            pointsNeeded: Math.max(0, v.pointsCost - pointBalance.availablePoints),
            canRedeem: pointBalance.availablePoints >= v.pointsCost,
          })),
          ...redeemableCoupons.map((c) => ({
            id: c.id,
            type: 'COUPON',
            title: c.title,
            description: c.description || undefined,
            imageUrl: undefined,
            pointsCost: c.pointsCost!,
            userPoints: pointBalance.availablePoints,
            pointsNeeded: Math.max(0, c.pointsCost! - pointBalance.availablePoints),
            canRedeem: pointBalance.availablePoints >= c.pointsCost!,
          }))
        )
      }

      // Add stamp card if close to completion AND not already used
      if (stampCard && stampCard.stampsUsed === 0 && stampCard.isActive && stampCard.template) {
        const stampsNeeded = stampCard.stampsRequired - stampCard.stampsCollected
        if (stampsNeeded <= stampThreshold) {
          redeemableRewards.push({
            id: stampCard.id,
            type: 'STAMP_CARD',
            title: stampCard.template.title || 'Stamp Card',
            description: stampCard.template.rewardDescription || undefined,
            imageUrl: stampCard.template.stampCoverUrl || undefined,
            stampCoverUrl: stampCard.template.stampCoverUrl || undefined,
            stampStickerIconUrl: stampCard.template.stampStickerIconUrl || undefined,
            stampsCollected: stampCard.stampsCollected,
            stampsRequired: stampCard.stampsRequired,
            stampsNeeded,
            canRedeem: stampsNeeded === 0,
          })
        }
      }

      result.redeemableRewards = redeemableRewards.sort((a, b) => {
        // Sort: redeemable first, then by points/stamps needed
        if (a.canRedeem && !b.canRedeem) return -1
        if (!a.canRedeem && b.canRedeem) return 1
        return (a.pointsNeeded || a.stampsNeeded || 0) - (b.pointsNeeded || b.stampsNeeded || 0)
      })
    }

    // Fetch promotions for this store (vouchers only, as main slider)
    const [vouchers, coupons] = await Promise.all([
      ctx.prisma.merchantVoucher.findMany({
        where: {
          storeId: id,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
        orderBy: { priority: 'desc' },
        take: 10, // Limit to 10 promotions for slider
      }),
      ctx.prisma.coupon.findMany({
        where: {
          merchantId: store.merchantId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
        take: 5, // Limit to 5 coupons
      }),
    ])

    // Combine vouchers and coupons into promotions array
    result.promotions = [
      ...vouchers.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description || undefined,
        imageUrl: v.imageUrl || undefined,
        value: v.value,
        pointsCost: v.pointsCost,
      })),
      ...coupons.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || undefined,
        imageUrl: c.imageUrl || undefined,
        value: undefined,
        pointsCost: c.pointsCost || undefined,
      })),
    ]

    return result
  }

  @Query(() => StoreOffers)
  async getStorePromotions(@Ctx() ctx: Context, @Arg('storeId') storeId: string): Promise<StoreOffers> {
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      include: { merchant: true, orderQueueConfig: true },
    })

    if (!store) {
      throw new ErrorWithStatus(404, 'Store not found')
    }

    const [vouchers, stampTemplates, coupons] = await Promise.all([
      ctx.prisma.merchantVoucher.findMany({
        where: {
          storeId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
        include: {
          merchant: { include: { category: true } },
          store: true,
        },
        orderBy: { priority: 'desc' },
      }),
      ctx.prisma.loyaltyStampCardTemplate.findMany({
        where: {
          merchantId: store.merchantId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
      }),
      ctx.prisma.coupon.findMany({
        where: {
          merchantId: store.merchantId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      }),
    ])

    return {
      vouchers: vouchers as any,
      stampTemplates: stampTemplates as any,
      coupons: coupons as any,
    }
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Query(() => [MerchantStore])
  async myStores(@Ctx() ctx: Context): Promise<MerchantStore[]> {
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const scopes = await merchantAccessService.resolveOperatorMerchantScopesByPermission(
      user.id,
      user.roles,
      OperatorPermission.STORE_READ
    )
    if (scopes.length < 1) {
      return []
    }

    const merchantIds = [...new Set(scopes.map((scope) => scope.merchantId))]
    const unrestrictedMerchantIds = scopes
      .filter((scope) => scope.scopeMode === 'FULL_MERCHANT' || scope.storeScopeAll)
      .map((scope) => scope.merchantId)
    const scopedStoreIds = scopes
      .filter((scope) => scope.scopeMode === 'STORE_SCOPED' && !scope.storeScopeAll)
      .flatMap((scope) => scope.storeIds)

    const stores = await ctx.prisma.merchantStore.findMany({
      where: {
        isActive: true,
        merchantId: { in: merchantIds },
        OR: [{ merchantId: { in: unrestrictedMerchantIds } }, { id: { in: scopedStoreIds } }],
      },
      include: { merchant: true, orderQueueConfig: true },
      orderBy: { name: 'asc' },
    })

    return MerchantStoreMapper.toGraphQLArray(stores)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Mutation(() => MerchantStore)
  async createMerchantStore(
    @Arg('merchantId') merchantId: string,
    @Arg('data') data: CreateMerchantStoreInput,
    @Ctx() ctx: Context
  ): Promise<MerchantStore> {
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const scopes = await merchantAccessService.resolveOperatorMerchantScopes(user.id, user.roles)
    const matchingScope = scopes.find((scope) => scope.merchantId === merchantId)
    if (!matchingScope) {
      throw new ErrorWithStatus(403, 'Merchant not found or access denied')
    }
    if (!matchingScope.permissions.includes(OperatorPermission.STORE_WRITE)) {
      throw new ErrorWithStatus(403, 'No access to create store')
    }
    if (matchingScope.scopeMode === 'STORE_SCOPED' && !matchingScope.storeScopeAll) {
      throw new ErrorWithStatus(403, 'Store scoped cooperator cannot create new stores')
    }

    const store = await ctx.prisma.merchantStore.create({
      data: {
        ...data,
        merchantId,
        isActive: true,
      },
      include: { merchant: true, orderQueueConfig: true },
    })

    // Auto-clear MERCHANT_STORE draft after successful creation
    await ctx.prisma.formDraft.deleteMany({
      where: {
        userId: ctx.req.user?.id,
        formType: 'MERCHANT_STORE',
      },
    })

    return MerchantStoreMapper.toGraphQL(store)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Mutation(() => MerchantStore)
  async updateMerchantStore(
    @Arg('storeId') storeId: string,
    @Arg('data') data: UpdateMerchantStoreInput,
    @Ctx() ctx: Context
  ): Promise<MerchantStore> {
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true },
    })
    if (!store) {
      throw new ErrorWithStatus(404, 'Store not found')
    }
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureStoreAccess(user.id, user.roles, store.merchantId, storeId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'Store not found or access denied')
    }
    const canWriteStore = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      store.merchantId,
      OperatorPermission.STORE_WRITE
    )
    if (!canWriteStore) {
      throw new ErrorWithStatus(403, 'No access to update store')
    }

    // Filtruj tylko niepuste wartości
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )

    const updatedStore = await ctx.prisma.merchantStore.update({
      where: { id: storeId },
      data: updateData,
      include: { merchant: true, orderQueueConfig: true },
    })

    return MerchantStoreMapper.toGraphQL(updatedStore)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async deleteMerchantStore(@Arg('storeId') storeId: string, @Ctx() ctx: Context): Promise<boolean> {
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true },
    })
    if (!store) {
      throw new ErrorWithStatus(404, 'Store not found')
    }
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureStoreAccess(user.id, user.roles, store.merchantId, storeId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'Store not found or access denied')
    }
    const canWriteStore = await merchantAccessService.hasPermission(
      user.id,
      user.roles,
      store.merchantId,
      OperatorPermission.STORE_WRITE
    )
    if (!canWriteStore) {
      throw new ErrorWithStatus(403, 'No access to delete store')
    }

    // Soft delete - ustaw isActive na false
    await ctx.prisma.merchantStore.update({
      where: { id: storeId },
      data: { isActive: false },
    })

    return true
  }
}
