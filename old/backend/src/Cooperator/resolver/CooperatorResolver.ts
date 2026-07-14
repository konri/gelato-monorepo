import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { CooperatorInput } from '../DTO/CooperatorInput'
import { Cooperator } from '../objectType/Cooperator'
import { AcceptCooperatorInvitationResult, CooperatorInvitationPreview } from '../objectType/CooperatorInvitation'
import { CooperatorInvitationService } from '../service/CooperatorInvitationService'
import { generateJWT } from '../../Auth/PasswordUtil'
import { RegistrationSelectRole } from '../../shared/objectType/RegistrationSelectRole'
import { CooperatorInvitationMapper } from '../../shared/mappers/CooperatorInvitationMapper'

@Resolver(Cooperator)
export class CooperatorResolver {
  @Authorized([Role.NEW_USER])
  @Mutation(() => RegistrationSelectRole)
  async createCooperator(@Arg('data') data: CooperatorInput, @Ctx() ctx: Context) {
    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.user?.id },
      select: { roles: true },
    })
    const existingRoles = currentUser?.roles || []
    const nextRoles = [...new Set(existingRoles.filter((role) => role !== Role.NEW_USER).concat(Role.COOPERATOR))]

    const user = await ctx.prisma.user.update({
      data: {
        roles: nextRoles,
      },
      where: {
        id: ctx.req.user?.id,
      },
    })
    await ctx.prisma.cooperator.create({
      data: {
        ...data,
        user: { connect: { id: ctx.req.user?.id } },
      },
    })
    const token = generateJWT(user)
    return { token, role: Role.COOPERATOR }
  }

  @Authorized([Role.COOPERATOR])
  @Mutation(() => Cooperator)
  async updateCooperator(@Arg('data') data: CooperatorInput, @Ctx() ctx: Context) {
    return ctx.prisma.cooperator.update({
      data,
      where: {
        userId: ctx.req.user?.id,
      },
    })
  }

  @Authorized([Role.COOPERATOR])
  @Query(() => Cooperator)
  async getMyCooperator(@Ctx() ctx: Context) {
    return ctx.prisma.cooperator.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
      include: {
        companies: true,
      },
    })
  }

  @Authorized([Role.OWNER])
  @Query(() => Cooperator)
  async getCooperatorById(@Arg('id') id: string, @Ctx() ctx: Context) {
    return ctx.prisma.cooperator.findFirst({
      where: {
        id,
      },
      include: {
        user: true,
      },
    })
  }

  @Query(() => CooperatorInvitationPreview)
  async previewCooperatorInvitation(
    @Arg('token') token: string,
    @Ctx() ctx: Context
  ): Promise<CooperatorInvitationPreview> {
    const invitationService = new CooperatorInvitationService(ctx.prisma)
    const preview = await invitationService.previewInvitation(token)
    return CooperatorInvitationMapper.toPreview(preview)
  }

  @Authorized([Role.NEW_USER, Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => AcceptCooperatorInvitationResult)
  async acceptCooperatorInvitation(
    @Arg('token') token: string,
    @Ctx() ctx: Context
  ): Promise<AcceptCooperatorInvitationResult> {
    const invitationService = new CooperatorInvitationService(ctx.prisma)
    return invitationService.acceptInvitation({
      token,
      userId: ctx.req.user!.id,
    })
  }
}
