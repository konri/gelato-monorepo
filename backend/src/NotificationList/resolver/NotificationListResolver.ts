import { Arg, Authorized, Ctx, Mutation, ObjectType, Query, Resolver } from 'type-graphql'

import { NotificationList } from '../objectType/NotificationList'
import PageableResponse from '../../shared/interface/PageableResponse'
import { Role } from '../../User/objectType/Role'
import { convertCursorPaginationToPrisma, CursorPagination } from '../../shared/interface/CursorPagination'
import { Context } from '../../shared/interface/Context'
import { NotificationCount } from '../objectType/NotificationCount'

@ObjectType()
class NotificationListPageableResponse extends PageableResponse<NotificationList>(NotificationList) {}

@Resolver(NotificationList)
export class NotificationListResolver {
  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Query(() => NotificationListPageableResponse)
  async getNotificationList(
    @Arg('pagination', { nullable: true }) cursorPagination: CursorPagination,
    @Ctx() ctx: Context
  ) {
    const pagination = convertCursorPaginationToPrisma(cursorPagination)

    const where = { userId: ctx.req.user?.id }
    const total = await ctx.prisma.notificationList.count({ where })

    const notificationList = await ctx.prisma.notificationList.findMany({
      where,
      ...pagination,
      include: {
        creator: true,
      },
    })

    const items = notificationList.map((notification) => {
      return {
        ...notification,
        additionalParams: JSON.stringify(notification.additionalParams),
      }
    })
    return { total, items }
  }

  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Query(() => NotificationCount)
  async unreadNotificationCount(@Ctx() ctx: Context) {
    const where = { userId: ctx.req.user?.id, isRead: false }
    const count = await ctx.prisma.notificationList.count({ where })
    return { count }
  }

  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => NotificationList)
  async markAsReadNotification(@Arg('id') id: string, @Ctx() ctx: Context) {
    return ctx.prisma.notificationList
      .update({
        where: { id },
        data: {
          isRead: true,
        },
      })
      .then((notification) => ({
        ...notification,
        additionalParams: JSON.stringify(notification.additionalParams),
      }))
  }
}
