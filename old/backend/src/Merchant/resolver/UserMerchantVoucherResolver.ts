import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql'
import { UserMerchantVoucher } from '../objectType/UserMerchantVoucher'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { MerchantPointsService } from '../../Coupon/service/MerchantPointsService'
import { v4 as uuidv4 } from 'uuid'

@Resolver(() => UserMerchantVoucher)
export class UserMerchantVoucherResolver {
  private merchantPointsService: MerchantPointsService

  constructor() {
    // Service will be initialized with prisma in each method
  }

  @Authorized([Role.CLIENT])
  @Query(() => [UserMerchantVoucher])
  async myMerchantVouchers(@Ctx() ctx: Context): Promise<UserMerchantVoucher[]> {
    const userId = ctx.req.user!.id

    const vouchers = await ctx.prisma.userMerchantVoucher.findMany({
      where: { userId },
      include: {
        merchantVoucher: {
          include: {
            merchant: true,
            store: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return vouchers as any
  }

  @Authorized([Role.CLIENT])
  @Mutation(() => UserMerchantVoucher)
  async purchaseMerchantVoucher(
    @Arg('merchantVoucherId') merchantVoucherId: string,
    @Arg('storeId', () => String) storeId: string,
    @Ctx() ctx: Context
  ): Promise<UserMerchantVoucher> {
    const userId = ctx.req.user!.id

    // Get merchant voucher
    const merchantVoucher = await ctx.prisma.merchantVoucher.findUnique({
      where: { id: merchantVoucherId },
      include: { merchant: true },
    })

    if (!merchantVoucher || !merchantVoucher.isActive) {
      throw new Error('Merchant voucher not found or inactive')
    }

    // Check if voucher is still valid
    if (merchantVoucher.validUntil && new Date() > merchantVoucher.validUntil) {
      throw new Error('Merchant voucher has expired')
    }

    // Initialize merchant points service
    this.merchantPointsService = new MerchantPointsService(ctx.prisma)

    // Check if user has enough points
    const balance = await this.merchantPointsService.getMerchantPointBalance(userId, merchantVoucher.merchantId)
    if (balance.availablePoints < merchantVoucher.pointsCost) {
      throw new Error(`Insufficient points. You have ${balance.availablePoints}, need ${merchantVoucher.pointsCost}`)
    }

    // Spend points
    await this.merchantPointsService.spendMerchantPoints(
      userId,
      merchantVoucher.merchantId,
      merchantVoucher.pointsCost,
      `Merchant Voucher: ${merchantVoucher.title}`,
      merchantVoucherId,
      'MERCHANT_VOUCHER',
      storeId
    )

    // Create user merchant voucher
    const qrCode = `MV-${uuidv4()}`
    const validUntil = merchantVoucher.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default

    const userVoucher = await ctx.prisma.userMerchantVoucher.create({
      data: {
        userId,
        merchantVoucherId,
        qrCode,
        isUsed: false,
        validUntil,
      },
      include: {
        merchantVoucher: {
          include: {
            merchant: true,
            store: true,
          },
        },
        user: true,
      },
    })

    // Create voucher history
    await ctx.prisma.voucherHistory.create({
      data: {
        userId,
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

    return userVoucher as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => UserMerchantVoucher)
  async useMerchantVoucher(@Arg('qrCode') qrCode: string, @Ctx() ctx: Context): Promise<UserMerchantVoucher> {
    const userVoucher = await ctx.prisma.userMerchantVoucher.findUnique({
      where: { qrCode },
      include: {
        merchantVoucher: {
          include: {
            merchant: true,
            store: true,
          },
        },
        user: true,
      },
    })

    if (!userVoucher) {
      throw new Error('Merchant voucher not found')
    }

    if (userVoucher.isUsed) {
      throw new Error('Merchant voucher has already been used')
    }

    if (new Date() > userVoucher.validUntil) {
      throw new Error('Merchant voucher has expired')
    }

    // Mark voucher as used
    const updatedVoucher = await ctx.prisma.userMerchantVoucher.update({
      where: { id: userVoucher.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
      include: {
        merchantVoucher: {
          include: {
            merchant: true,
            store: true,
          },
        },
        user: true,
      },
    })

    // Create voucher history
    await ctx.prisma.voucherHistory.create({
      data: {
        userId: userVoucher.userId,
        voucherType: 'MERCHANT_VOUCHER',
        voucherId: userVoucher.id,
        voucherCode: qrCode,
        voucherTitle: userVoucher.merchantVoucher.title,
        action: 'USED',
        metadata: {
          merchantId: userVoucher.merchantVoucher.merchantId,
          merchantName: userVoucher.merchantVoucher.merchant.name,
          usedBy: ctx.req.user!.id,
        },
      },
    })

    return updatedVoucher as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => UserMerchantVoucher, { nullable: true })
  async userMerchantVoucherByQr(
    @Arg('qrCode') qrCode: string,
    @Ctx() ctx: Context
  ): Promise<UserMerchantVoucher | null> {
    const voucher = await ctx.prisma.userMerchantVoucher.findUnique({
      where: { qrCode },
      include: {
        merchantVoucher: {
          include: {
            merchant: true,
            store: true,
          },
        },
        user: true,
      },
    })

    return voucher as any
  }
}
