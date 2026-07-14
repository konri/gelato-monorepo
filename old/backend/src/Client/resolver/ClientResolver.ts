import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { generateJWT } from '../../Auth/PasswordUtil'
import { RegistrationSelectRole } from '../../shared/objectType/RegistrationSelectRole'
import { Client } from '../objectType/Client'

@Resolver(Client)
export class ClientResolver {
  @Authorized([Role.NEW_USER])
  @Mutation(() => RegistrationSelectRole)
  async createClient(@Ctx() ctx: Context) {
    const user = await ctx.prisma.user.update({
      data: {
        roles: [Role.CLIENT],
      },
      where: {
        id: ctx.req.user?.id,
      },
    })

    await ctx.prisma.client.create({
      data: {
        user: { connect: { id: ctx.req.user?.id } },
      },
    })

    const token = generateJWT(user)
    return { token, role: Role.CLIENT }
  }

  @Authorized([Role.CLIENT])
  @Query(() => Client)
  async getMyClient(@Ctx() ctx: Context) {
    return ctx.prisma.client.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
      include: {
        user: true,
      },
    })
  }

  @Authorized([Role.OWNER])
  @Query(() => Client)
  async getClientById(@Arg('id') id: string, @Ctx() ctx: Context) {
    return ctx.prisma.client.findFirst({
      where: {
        id,
      },
      include: {
        user: true,
      },
    })
  }
}
