import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { FavoriteStore } from '../objectType/FavoriteStore'

@Resolver()
export class FavoriteStoreResolver {
  @Authorized([Role.CLIENT])
  @Query(() => [FavoriteStore])
  async myFavoriteStores(@Ctx() ctx: Context): Promise<FavoriteStore[]> {
    const userId = ctx.req.user!.id

    const favorites = await ctx.prisma.favoriteStore.findMany({
      where: { userId },
      include: {
        merchantStore: {
          include: { merchant: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return favorites as any
  }

  @Authorized([Role.CLIENT])
  @Mutation(() => FavoriteStore)
  async addFavoriteStore(@Arg('merchantStoreId') merchantStoreId: string, @Ctx() ctx: Context): Promise<FavoriteStore> {
    const userId = ctx.req.user!.id

    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
    })
    if (!store) throw new Error('Store not found')
    if (!store.isActive) throw new Error('Store is not active')

    const existing = await ctx.prisma.favoriteStore.findUnique({
      where: { userId_merchantStoreId: { userId, merchantStoreId } },
    })
    if (existing) throw new Error('Store already in favorites')

    const favorite = await ctx.prisma.favoriteStore.create({
      data: { userId, merchantStoreId },
      include: {
        merchantStore: {
          include: { merchant: true },
        },
      },
    })

    return favorite as any
  }

  @Authorized([Role.CLIENT])
  @Mutation(() => Boolean)
  async removeFavoriteStore(@Arg('merchantStoreId') merchantStoreId: string, @Ctx() ctx: Context): Promise<boolean> {
    const userId = ctx.req.user!.id

    const existing = await ctx.prisma.favoriteStore.findUnique({
      where: { userId_merchantStoreId: { userId, merchantStoreId } },
    })
    if (!existing) throw new Error('Store not in favorites')

    await ctx.prisma.favoriteStore.delete({
      where: { userId_merchantStoreId: { userId, merchantStoreId } },
    })

    return true
  }
}
