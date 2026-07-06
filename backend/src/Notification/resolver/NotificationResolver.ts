import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { Notification } from '../objectType/Notification'
import { NotificationMessage } from '../DTO/NotificationMessage'
import { BaseMessage, sendMultipleNotifications } from '../../shared/service/notifications'

@Resolver(Notification)
export class NotificationResolver {
  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR])
  @Mutation(() => Notification)
  async setNotificationToken(@Arg('token') token: string, @Ctx() ctx: Context) {
    return ctx.prisma.notificationToken.create({
      data: {
        token,
        user: { connect: { id: ctx.req.user?.id } },
      },
    })
  }
  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR])
  @Mutation(() => Notification)
  async removeNotificationToken(@Arg('token') token: string, @Ctx() ctx: Context) {
    return ctx.prisma.notificationToken.delete({
      where: {
        UniqueToken: {
          userId: ctx.req.user?.id!,
          token: token,
        },
      },
    })
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => [Notification])
  async sendNotifications(@Arg('data') notification: NotificationMessage, @Ctx() ctx: Context) {
    const userIds = notification.usersId
    const notificationTokens = await ctx.prisma.notificationToken.findMany({
      where: {
        userId: { in: userIds },
      },
    })

    const additionalParams = notification.additionalParams && JSON.parse(notification.additionalParams)
    const notificationToSend: BaseMessage = {
      notification: {
        title: notification.title,
        body: notification.text,
        imageUrl: notification.image,
      },
      data: additionalParams,
    }
    const tokens = notificationTokens.map((token) => token.token)
    const response = await sendMultipleNotifications(tokens, notificationToSend)
    return notificationTokens
  }

  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR])
  @Query(() => [Notification])
  async getAllTokensForUser(@Ctx() ctx: Context) {
    return ctx.prisma.notificationToken.findMany({
      where: {
        userId: ctx.req.user?.id,
      },
    })
  }
}
