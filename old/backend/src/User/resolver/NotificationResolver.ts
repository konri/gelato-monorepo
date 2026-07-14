import 'reflect-metadata'
import { Resolver, Query, Mutation, Arg, Ctx, Authorized, Int } from 'type-graphql'
import { PushNotification, NotificationCategory, PushNotificationCount } from '../objectType/Notification'
import { Context } from '../../shared/interface/Context'
import { Role } from '../objectType/Role'
import { NotificationService } from '../../services/NotificationService'

@Resolver(() => PushNotification)
export class NotificationResolver {
  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Query(() => [PushNotification])
  async myNotifications(
    @Arg('category', () => NotificationCategory, { nullable: true }) category: NotificationCategory | undefined,
    @Ctx() ctx: Context
  ) {
    const where: any = { userId: ctx.req.user!.id }
    if (category) where.category = category

    return ctx.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Query(() => Int)
  async unreadNotificationsCount(
    @Arg('category', () => NotificationCategory, { nullable: true }) category: NotificationCategory | undefined,
    @Ctx() ctx: Context
  ) {
    const where: any = { userId: ctx.req.user!.id, isRead: false }
    if (category) where.category = category

    return ctx.prisma.notification.count({ where })
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Query(() => [PushNotificationCount])
  async unreadNotificationsByCategory(@Ctx() ctx: Context) {
    const [generalCount, promotionsCount] = await Promise.all([
      ctx.prisma.notification.count({
        where: { userId: ctx.req.user!.id, isRead: false, category: 'GENERAL' },
      }),
      ctx.prisma.notification.count({
        where: { userId: ctx.req.user!.id, isRead: false, category: 'PROMOTIONS' },
      }),
    ])

    return [
      { category: NotificationCategory.GENERAL, count: generalCount },
      { category: NotificationCategory.PROMOTIONS, count: promotionsCount },
    ]
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async markNotificationAsRead(@Arg('notificationId') notificationId: string, @Ctx() ctx: Context) {
    await ctx.prisma.notification.updateMany({
      where: { id: notificationId, userId: ctx.req.user!.id },
      data: { isRead: true, readAt: new Date() },
    })
    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async markAllNotificationsAsRead(
    @Arg('category', () => NotificationCategory, { nullable: true }) category: NotificationCategory | undefined,
    @Ctx() ctx: Context
  ) {
    const where: any = { userId: ctx.req.user!.id, isRead: false }
    if (category) where.category = category

    await ctx.prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    })
    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async deleteNotification(@Arg('notificationId') notificationId: string, @Ctx() ctx: Context) {
    await ctx.prisma.notification.deleteMany({
      where: { id: notificationId, userId: ctx.req.user!.id },
    })
    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async registerDevice(
    @Arg('fcmToken') fcmToken: string,
    @Arg('platform') platform: string,
    @Arg('deviceId') deviceId: string,
    @Arg('deviceName', () => String, { nullable: true }) deviceName: string | undefined,
    @Ctx() ctx: Context
  ) {
    await ctx.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId: ctx.req.user!.id, deviceId } },
      create: {
        userId: ctx.req.user!.id,
        fcmToken,
        platform,
        deviceId,
        deviceName,
      },
      update: {
        fcmToken,
        isActive: true,
        lastUsedAt: new Date(),
        deviceName,
      },
    })
    return true
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR])
  @Mutation(() => Boolean)
  async unregisterDevice(@Arg('deviceId') deviceId: string, @Ctx() ctx: Context) {
    await ctx.prisma.userDevice.updateMany({
      where: { userId: ctx.req.user!.id, deviceId },
      data: { isActive: false },
    })
    return true
  }
}
