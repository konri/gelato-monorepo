import 'reflect-metadata'
import { Resolver, Mutation, Ctx, Authorized } from 'type-graphql'
import { Context } from '../shared/interface/Context'
import { Role } from '../User/objectType/Role'

@Resolver()
export class LogoutResolver {
  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.NEW_USER, Role.ADMIN])
  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: Context): Promise<boolean> {
    const token = ctx.req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      // Add token to blacklist with expiration
      await ctx.prisma.tokenBlacklist.create({
        data: {
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      })
    }

    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.NEW_USER, Role.ADMIN])
  @Mutation(() => Boolean)
  async logoutAllDevices(@Ctx() ctx: Context): Promise<boolean> {
    const userId = ctx.req.user!.id

    // Invalidate all tokens for this user by updating tokenVersion
    await ctx.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    })

    return true
  }
}
