import 'reflect-metadata'
import { Resolver, Query, Mutation, Arg, Ctx, ID, FieldResolver, Root } from 'type-graphql'
import { UserPointVoucher } from '../objectType/UserPointVoucher'
import { PointVoucher } from '../objectType/PointVoucher'
import { User } from '../../User/objectType/User'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { v4 as uuidv4 } from 'uuid'

@Resolver(() => UserPointVoucher)
export class UserPointVoucherResolver {
  @Query(() => [UserPointVoucher])
  async myPointVouchers(@Ctx() ctx: Context) {
    return ctx.prisma.userPointVoucher.findMany({
      where: { userId: ctx.req.user!.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  @Query(() => UserPointVoucher, { nullable: true })
  async userPointVoucherByQr(@Arg('qrCode') qrCode: string, @Ctx() ctx: Context) {
    return ctx.prisma.userPointVoucher.findUnique({
      where: { qrCode },
    })
  }

  @Mutation(() => UserPointVoucher)
  async usePointVoucher(@Arg('qrCode') qrCode: string, @Ctx() ctx: Context) {
    const userVoucher = await ctx.prisma.userPointVoucher.findUnique({
      where: { qrCode },
      include: { pointVoucher: true },
    })

    if (!userVoucher) {
      throw new ErrorWithStatus(404, 'Voucher not found')
    }

    if (userVoucher.isUsed) {
      throw new ErrorWithStatus(410, 'Voucher has already been used')
    }

    if (userVoucher.validUntil < new Date()) {
      throw new ErrorWithStatus(410, 'Voucher has expired')
    }

    // Wykonaj wszystkie operacje w jednej transakcji
    return await ctx.prisma.$transaction(async (tx) => {
      // 1. Oznacz voucher jako użyty
      const updatedVoucher = await tx.userPointVoucher.update({
        where: { id: userVoucher.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      })

      // VoucherHistory tworzy się automatycznie przez trigger
      return updatedVoucher
    })
  }

  @FieldResolver(() => User)
  async user(@Root() userPointVoucher: UserPointVoucher, @Ctx() ctx: Context) {
    return ctx.prisma.user.findUnique({
      where: { id: userPointVoucher.userId },
    })
  }

  @FieldResolver(() => PointVoucher)
  async pointVoucher(@Root() userPointVoucher: UserPointVoucher, @Ctx() ctx: Context) {
    return ctx.prisma.pointVoucher.findUnique({
      where: { id: userPointVoucher.pointVoucherId },
    })
  }
}
