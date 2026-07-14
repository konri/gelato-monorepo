import 'reflect-metadata'
import { Resolver, Query, Mutation, Arg, Ctx, FieldResolver, Root } from 'type-graphql'
import { UserPointBalance } from '../objectType/UserPointBalance'
import { PointTransaction, TransactionType } from '../objectType/PointTransaction'
import { VoucherHistory } from '../objectType/VoucherHistory'
import { User } from '../../User/objectType/User'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { v4 as uuidv4 } from 'uuid'
import { UserRewardService } from '../../Reward/service/UserRewardService'
import { PushNotificationHelper } from '../../services/PushNotificationHelper'

@Resolver(() => UserPointBalance)
export class PointsResolver {
  @Query(() => UserPointBalance, { nullable: true })
  async myPointBalance(@Ctx() ctx: Context): Promise<UserPointBalance | null> {
    if (!ctx.req.user) {
      throw new ErrorWithStatus(401, 'You must be logged in')
    }

    const result = await ctx.prisma.userPointBalance.findUnique({
      where: { userId: ctx.req.user.id },
    })
    return result as UserPointBalance | null
  }

  @Query(() => [PointTransaction])
  async myPointTransactions(@Ctx() ctx: Context): Promise<PointTransaction[]> {
    if (!ctx.req.user) {
      throw new ErrorWithStatus(401, 'You must be logged in')
    }

    const result = await ctx.prisma.pointTransaction.findMany({
      where: { userId: ctx.req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return result as PointTransaction[]
  }

  @Query(() => [VoucherHistory])
  async myVoucherHistory(@Ctx() ctx: Context): Promise<VoucherHistory[]> {
    if (!ctx.req.user) {
      throw new ErrorWithStatus(401, 'You must be logged in')
    }

    const result = await ctx.prisma.voucherHistory.findMany({
      where: { userId: ctx.req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return result as VoucherHistory[]
  }

  @Mutation(() => UserPointBalance)
  async addPoints(
    @Arg('amount') amount: number,
    @Arg('description') description: string,
    @Ctx() ctx: Context
  ): Promise<UserPointBalance> {
    if (!ctx.req.user) {
      throw new ErrorWithStatus(401, 'You must be logged in')
    }

    const userId = ctx.req.user.id

    // Sprawdź czy użytkownik istnieje
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new ErrorWithStatus(404, 'User does not exist')
    }

    // Wykonaj wszystkie operacje w jednej transakcji
    const balance = await ctx.prisma.$transaction(async (tx) => {
      // Znajdź lub utwórz saldo punktów
      let balance = await tx.userPointBalance.findUnique({
        where: { userId },
      })

      if (!balance) {
        balance = await tx.userPointBalance.create({
          data: {
            id: uuidv4(),
            userId,
            totalPoints: 0,
            availablePoints: 0,
            lockedPoints: 0,
          },
        })
      }

      const balanceBefore = balance.availablePoints
      const balanceAfter = balanceBefore + amount

      // Utwórz transakcję
      await tx.pointTransaction.create({
        data: {
          id: uuidv4(),
          userId,
          type: TransactionType.EARNED,
          amount,
          description,
          balanceBefore,
          balanceAfter,
        },
      })

      // Zaktualizuj saldo
      const result = await tx.userPointBalance.update({
        where: { userId },
        data: {
          totalPoints: { increment: amount },
          availablePoints: { increment: amount },
        },
      })
      return result as UserPointBalance
    })

    const userRewardService = new UserRewardService(ctx.prisma)
    await userRewardService.refreshAvailableRewardsForUser(userId)

    // Send push notification
    await PushNotificationHelper.sendPointsEarned({
      userId,
      amount,
      description,
      prisma: ctx.prisma,
    })

    return balance
  }

  @FieldResolver(() => User)
  async user(@Root() pointBalance: UserPointBalance, @Ctx() ctx: Context): Promise<User> {
    return ctx.prisma.user.findUnique({
      where: { id: pointBalance.userId },
    }) as Promise<User>
  }
}
