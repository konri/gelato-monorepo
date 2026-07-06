import 'reflect-metadata'
import { Resolver, Query, Mutation, Arg, Ctx, ID, FieldResolver, Root } from 'type-graphql'
import { PointVoucher } from '../objectType/PointVoucher'
import { UserPointVoucher } from '../objectType/UserPointVoucher'
import { CreatePointVoucherInput } from '../input/CreatePointVoucherInput'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { TransactionType } from '../../Points/objectType/PointTransaction'
import { v4 as uuidv4 } from 'uuid'

@Resolver(() => PointVoucher)
export class PointVoucherResolver {
  @Query(() => [PointVoucher])
  async pointVouchers(@Ctx() ctx: Context) {
    return ctx.prisma.pointVoucher.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  @Query(() => PointVoucher, { nullable: true })
  async pointVoucher(@Arg('id', () => ID) id: string, @Ctx() ctx: Context) {
    return ctx.prisma.pointVoucher.findUnique({
      where: { id },
    })
  }

  @Mutation(() => PointVoucher)
  async createPointVoucher(@Arg('data') data: CreatePointVoucherInput, @Ctx() ctx: Context) {
    return ctx.prisma.pointVoucher.create({
      data: {
        ...data,
        id: uuidv4(),
      },
    })
  }

  @Mutation(() => UserPointVoucher)
  async purchasePointVoucher(
    @Arg('pointVoucherId', () => ID) pointVoucherId: string,
    @Ctx() ctx: Context
  ): Promise<UserPointVoucher> {
    if (!ctx.req.user) {
      throw new ErrorWithStatus(401, 'You must be logged in to purchase a voucher')
    }
    const voucher = await ctx.prisma.pointVoucher.findUnique({
      where: { id: pointVoucherId },
    })

    if (!voucher || !voucher.isActive) {
      throw new ErrorWithStatus(404, 'Voucher does not exist or is inactive')
    }

    if (voucher.currentUses >= voucher.maxUses) {
      throw new ErrorWithStatus(410, 'Voucher has already been used the maximum number of times')
    }

    // Sprawdź czy voucher jest ważny
    const now = new Date()
    if (voucher.validFrom && voucher.validFrom > now) {
      throw new ErrorWithStatus(400, 'Voucher is not yet valid')
    }
    if (voucher.validUntil && voucher.validUntil < now) {
      throw new ErrorWithStatus(410, 'Voucher has already expired')
    }

    // Sprawdź saldo punktów użytkownika
    let userBalance = await ctx.prisma.userPointBalance.findUnique({
      where: { userId: ctx.req.user.id },
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
    const qrCode = uuidv4()
    const validUntil = voucher.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dni

    // Wykonaj wszystkie operacje w jednej transakcji bazodanowej
    const result = await ctx.prisma.$transaction(async (tx) => {
      // 1. Utwórz transakcję wydania punktów
      await tx.pointTransaction.create({
        data: {
          id: uuidv4(),
          userId: ctx.req.user!.id,
          type: TransactionType.SPENT,
          amount: -voucher.pointsCost,
          description: `Zakup vouchera: ${voucher.title}`,
          referenceId: pointVoucherId,
          referenceType: 'POINT_VOUCHER',
          balanceBefore,
          balanceAfter,
        },
      })

      // 2. Odejmij punkty od salda
      await tx.userPointBalance.update({
        where: { userId: ctx.req.user!.id },
        data: {
          availablePoints: { decrement: voucher.pointsCost },
        },
      })

      // 3. Utwórz voucher użytkownika
      const userVoucher = await tx.userPointVoucher.create({
        data: {
          userId: ctx.req.user!.id,
          pointVoucherId,
          qrCode,
          validUntil,
        },
      })

      return userVoucher as UserPointVoucher

      // 4. Zwiększ licznik użyć (VoucherHistory tworzy się automatycznie przez trigger)
      await tx.pointVoucher.update({
        where: { id: pointVoucherId },
        data: { currentUses: { increment: 1 } },
      })

      return userVoucher as UserPointVoucher
    })

    // Award referral points for client activity (first point voucher purchase)
    const { ReferralService } = await import('../../Referral/service/ReferralService')
    await ReferralService.awardReferralPoints(ctx.req.user.id, 'CLIENT_ACTIVE')

    return result
  }

  @FieldResolver(() => [UserPointVoucher])
  async userPointVouchers(@Root() pointVoucher: PointVoucher, @Ctx() ctx: Context) {
    return ctx.prisma.userPointVoucher.findMany({
      where: { pointVoucherId: pointVoucher.id },
    })
  }
}
