import 'reflect-metadata'
import { Resolver, Query, Mutation, Ctx, Authorized, Arg, Int } from 'type-graphql'
import { OperatorPermission } from '@prisma/client'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { Merchant } from '../objectType/Merchant'
import { Category } from '../objectType/Category'
import { MerchantVoucher } from '../objectType/MerchantVoucher'
import { VoucherDisplayType } from '../objectType/VoucherDisplayType'
import { UpdateMerchantInput } from '../DTO/UpdateMerchantInput'
import { CreateMerchantInput } from '../DTO/CreateMerchantInput'
import { MerchantMapper } from '../../shared/mappers/MerchantMapper'
import { LocationSearchInput } from '../../Location/inputType/LocationSearchInput'
import { LocationService } from '../../Location/service/LocationService'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'

@Resolver()
export class MerchantResolver {
  @Query(() => [Merchant])
  async getMerchants(
    @Ctx() ctx: Context,
    @Arg('search', { nullable: true }) search?: string,
    @Arg('categoryIds', () => [String], { nullable: true }) categoryIds?: string[],
    @Arg('city', { nullable: true }) city?: string,
    @Arg('page', () => Int, { defaultValue: 1 }) page: number = 1,
    @Arg('pageSize', () => Int, { defaultValue: 12 }) pageSize: number = 12
  ): Promise<Merchant[]> {
    const skip = (page - 1) * pageSize

    const where: any = {
      isActive: true,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
      ...(categoryIds &&
        categoryIds.length > 0 && {
          categoryId: {
            in: categoryIds,
          },
        }),
      ...(city && {
        stores: {
          some: {
            city: {
              contains: city,
              mode: 'insensitive',
            },
          },
        },
      }),
    }

    const merchants = await ctx.prisma.merchant.findMany({
      where,
      include: {
        category: true,
        stores: true,
        vouchers: {
          where: { isActive: true },
        },
        streakPrograms: {
          where: { isActive: true },
          include: {
            stages: { orderBy: { dayThreshold: 'asc' } },
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
    })

    return MerchantMapper.toGraphQLArray(merchants)
  }

  @Query(() => Merchant, { nullable: true })
  async getMerchant(@Ctx() ctx: Context, @Arg('id') id: string): Promise<Merchant | null> {
    const merchant = await ctx.prisma.merchant.findUnique({
      where: { id },
      include: {
        category: true,
        stores: {
          where: { isActive: true },
        },
        vouchers: {
          where: { isActive: true },
        },
        streakPrograms: {
          where: { isActive: true },
          include: {
            stages: { orderBy: { dayThreshold: 'asc' } },
          },
        },
      },
    })

    return merchant ? MerchantMapper.toGraphQL(merchant) : null
  }

  @Query(() => [MerchantVoucher])
  async availableMerchantVouchers(
    @Arg('merchantId') merchantId: string,
    @Ctx() ctx: Context
  ): Promise<MerchantVoucher[]> {
    const vouchers = await ctx.prisma.merchantVoucher.findMany({
      where: {
        merchantId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      include: {
        merchant: true,
        store: true,
      },
      orderBy: { priority: 'desc' },
    })

    return vouchers as any
  }

  @Query(() => [Category])
  async getCategories(@Ctx() ctx: Context): Promise<Category[]> {
    const categories = await ctx.prisma.category.findMany({
      include: {
        merchants: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return categories as Category[]
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Merchant)
  async updateMerchant(
    @Arg('merchantId') merchantId: string,
    @Arg('data') data: UpdateMerchantInput,
    @Ctx() ctx: Context
  ): Promise<Merchant> {
    const user = ctx.req.user!
    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const hasAccess = await merchantAccessService.ensureMerchantAccess(user.id, user.roles, merchantId)
    if (!hasAccess) {
      throw new ErrorWithStatus(403, 'Merchant not found or access denied')
    }
    const canEditMerchant = await merchantAccessService.canEditMerchantWideBaseConfig(
      user.id,
      user.roles,
      merchantId,
      OperatorPermission.MERCHANT_PROFILE_WRITE
    )
    if (!canEditMerchant) {
      throw new ErrorWithStatus(403, 'No access to edit merchant-wide configuration (full merchant scope required)')
    }

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )

    const updatedMerchant = await ctx.prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      include: {
        category: true,
        stores: true,
      },
    })

    return MerchantMapper.toGraphQL(updatedMerchant)
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Query(() => [Merchant])
  async myMerchants(@Ctx() ctx: Context): Promise<Merchant[]> {
    const user = ctx.req.user!
    const dbUser = await ctx.prisma.user.findUnique({
      where: { id: user.id },
      select: { roles: true },
    })
    if (!dbUser) {
      throw new ErrorWithStatus(404, 'User not found')
    }

    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const scopes = await merchantAccessService.resolveOperatorMerchantScopes(user.id, dbUser.roles)
    const merchantIds = [...new Set(scopes.map((scope) => scope.merchantId))]
    if (merchantIds.length < 1) {
      return []
    }

    const merchants = await ctx.prisma.merchant.findMany({
      where: { id: { in: merchantIds } },
      include: {
        category: true,
        stores: true,
        vouchers: true,
        streakPrograms: {
          where: { isActive: true },
          include: {
            stages: { orderBy: { dayThreshold: 'asc' } },
          },
        },
      },
    })

    return merchants.map((merchant) => MerchantMapper.toGraphQL(merchant))
  }

  @Authorized([Role.OWNER])
  @Mutation(() => Merchant)
  async createMyMerchant(@Arg('data') data: CreateMerchantInput, @Ctx() ctx: Context): Promise<Merchant> {
    const company = await ctx.prisma.company.findUnique({
      where: { userId: ctx.req.user!.id },
      include: { merchant: true },
    })

    if (!company) {
      throw new ErrorWithStatus(404, 'Company not found')
    }

    if (company.merchant) {
      throw new ErrorWithStatus(409, 'Merchant already exists for this company')
    }

    let baseSlug = data.name.toLowerCase().replace(/\s+/g, '-')
    let slug = baseSlug
    let counter = 1

    while (await ctx.prisma.merchant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const merchant = await ctx.prisma.merchant.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        iconUrl: data.iconUrl,
        categoryId: data.categoryId,
        companyId: company.id,
        isActive: false,
        isVerified: false,
      },
      include: {
        category: true,
        stores: true,
      },
    })

    // Auto-clear MERCHANT draft after successful creation
    await ctx.prisma.formDraft.deleteMany({
      where: {
        userId: ctx.req.user?.id,
        formType: 'MERCHANT',
      },
    })

    return MerchantMapper.toGraphQL(merchant)
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Merchant)
  async createMerchant(@Arg('data') data: CreateMerchantInput, @Ctx() ctx: Context): Promise<Merchant> {
    let baseSlug = data.name.toLowerCase().replace(/\s+/g, '-')
    let slug = baseSlug
    let counter = 1

    while (await ctx.prisma.merchant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const merchant = await ctx.prisma.merchant.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        iconUrl: data.iconUrl,
        categoryId: data.categoryId,
        isActive: true,
      },
      include: {
        category: true,
        stores: true,
      },
    })

    return MerchantMapper.toGraphQL(merchant)
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Merchant)
  async verifyMerchant(@Arg('merchantId') merchantId: string, @Ctx() ctx: Context): Promise<Merchant> {
    const merchant = await ctx.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: ctx.req.user!.id,
      },
      include: {
        category: true,
        stores: true,
      },
    })

    return MerchantMapper.toGraphQL(merchant)
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Merchant)
  async toggleMerchantActive(@Arg('merchantId') merchantId: string, @Ctx() ctx: Context): Promise<Merchant> {
    const merchant = await ctx.prisma.merchant.findUnique({
      where: { id: merchantId },
    })

    if (!merchant) {
      throw new ErrorWithStatus(404, 'Merchant not found')
    }

    const updated = await ctx.prisma.merchant.update({
      where: { id: merchantId },
      data: { isActive: !merchant.isActive },
      include: {
        category: true,
        stores: true,
      },
    })

    return MerchantMapper.toGraphQL(updated)
  }

  @Query(() => [MerchantVoucher])
  async promotedVouchers(
    @Arg('location', { nullable: true }) location: LocationSearchInput,
    @Arg('displayType', () => VoucherDisplayType, { nullable: true }) displayType: VoucherDisplayType,
    @Ctx() ctx: Context
  ): Promise<MerchantVoucher[]> {
    const userId = ctx.req.user?.id

    if (!location?.latitude || !location?.longitude) {
      if (!userId) {
        throw new ErrorWithStatus(401, 'Authentication required when location not provided')
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredCity: true },
      })

      if (!user?.preferredCity) {
        throw new ErrorWithStatus(400, 'User city required when location not provided')
      }

      const vouchers = await ctx.prisma.merchantVoucher.findMany({
        where: {
          ...(displayType ? { displayType } : {}),
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          store: {
            city: { equals: user.preferredCity, mode: 'insensitive' },
            isActive: true,
          },
        },
        include: {
          merchant: { include: { category: true } },
          store: true,
        },
        orderBy: { priority: 'desc' },
      })

      return vouchers as any
    }

    const locationService = new LocationService(ctx.prisma)
    const radiusKm = location.radiusKm || 50

    const vouchers = await ctx.prisma.merchantVoucher.findMany({
      where: {
        ...(displayType ? { displayType } : {}),
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        store: {
          latitude: { not: null },
          longitude: { not: null },
          isActive: true,
        },
      },
      include: {
        merchant: { include: { category: true } },
        store: true,
      },
    })

    const vouchersWithDistance = vouchers
      .filter((v) => v.store?.latitude && v.store?.longitude)
      .map((v) => ({
        voucher: v,
        distance: locationService.calculateDistance(
          location.latitude!,
          location.longitude!,
          v.store!.latitude!,
          v.store!.longitude!
        ),
      }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.voucher.priority - b.voucher.priority || a.distance - b.distance)
      .map((item) => item.voucher)

    return vouchersWithDistance as any
  }
}
