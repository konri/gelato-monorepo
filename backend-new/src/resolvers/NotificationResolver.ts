import { Resolver, Mutation, Arg, Ctx, Authorized, Query } from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';
import { FCMService, NotificationType } from '../services/FCMService';

/**
 * Notification Management Resolver
 *
 * Handles:
 * - FCM token registration/removal
 * - Topic subscriptions
 * - Admin notification broadcasting
 */
@Resolver()
export class NotificationResolver {
  /**
   * Register FCM token for push notifications
   */
  @Authorized()
  @Mutation(() => Boolean)
  async registerFCMToken(
    @Arg('token') token: string,
    @Arg('platform', { defaultValue: 'android' }) platform: string,
    @Arg('deviceId') deviceId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Check if token already exists for this user
    const existingToken = await prisma.deviceToken.findFirst({
      where: {
        userId: user.id,
        deviceId,
      },
    });

    if (existingToken) {
      // Update existing token
      await prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          platform,
          isActive: true,
        },
      });
    } else {
      // Create new device token
      await prisma.deviceToken.create({
        data: {
          userId: user.id,
          token,
          platform,
          deviceId,
          isActive: true,
        },
      });
    }

    // Subscribe to role-based topics
    const topics: string[] = [];
    if (user.roles.includes(Role.CLIENT)) {
      topics.push('clients');
    }
    if (user.roles.includes(Role.COURIER)) {
      topics.push('couriers');
    }
    if (user.roles.includes(Role.SPOT_ADMIN) || user.roles.includes(Role.EMPLOYEE)) {
      topics.push('spot_staff');
    }

    for (const topic of topics) {
      await FCMService.subscribeToTopic([token], topic);
    }

    console.log(`✅ FCM token registered for user: ${user.email}`);

    return true;
  }

  /**
   * Remove FCM token (e.g., on logout or device change)
   */
  @Authorized()
  @Mutation(() => Boolean)
  async removeFCMToken(
    @Arg('deviceId') deviceId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Deactivate device token
    await prisma.deviceToken.updateMany({
      where: {
        userId: user.id,
        deviceId,
      },
      data: {
        isActive: false,
      },
    });

    console.log(`✅ FCM token removed for user: ${user.email}, device: ${deviceId}`);

    return true;
  }

  /**
   * Get user's registered FCM tokens
   */
  @Authorized()
  @Query(() => [String])
  async myFCMTokens(@Ctx() { req, prisma }: Context): Promise<string[]> {
    const user = req.user!;
    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        token: true,
      },
    });
    return tokens.map((t) => t.token);
  }

  /**
   * Send test notification to self (for testing)
   */
  @Authorized()
  @Mutation(() => Boolean)
  async sendTestNotification(@Ctx() { req, prisma }: Context): Promise<boolean> {
    const user = req.user!;

    const sent = await FCMService.sendToUser(
      user.id,
      NotificationType.POINTS_EARNED,
      {
        points: '100',
        totalPoints: '500',
      },
      {},
      prisma
    );

    return sent > 0;
  }

  /**
   * Broadcast notification to all clients (SUPER_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => Boolean)
  async broadcastToClients(
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Arg('language', { defaultValue: 'pl' }) language: 'pl' | 'en' | 'ua' = 'pl'
  ): Promise<boolean> {
    // Use NEWS_PUBLISHED type for custom broadcasts
    return FCMService.sendToTopic(
      'clients',
      NotificationType.NEWS_PUBLISHED,
      language,
      {
        newsTitle: title,
      },
      {
        customBody: body,
      }
    );
  }

  /**
   * Broadcast a push to clients in a specific city (SUPER_ADMIN only).
   * FCM topics can't be filtered by city, so we resolve the audience
   * ourselves: find CLIENT users whose preferredCityId matches, gather their
   * active device tokens, and send to each.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => Boolean)
  async broadcastToCity(
    @Arg('cityId') cityId: string,
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Arg('language', { defaultValue: 'pl' }) language: 'pl' | 'en' | 'ua' = 'pl',
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    // Active device tokens of CLIENTs who chose this city.
    const tokens = await prisma.deviceToken.findMany({
      where: {
        isActive: true,
        user: {
          preferredCityId: cityId,
          roles: { has: Role.CLIENT },
        },
      },
      select: { token: true },
    });

    if (tokens.length === 0) return false;

    const results = await Promise.all(
      tokens.map((t) =>
        FCMService.sendToDevice(
          t.token,
          NotificationType.NEWS_PUBLISHED,
          language,
          { newsTitle: title },
          { customBody: body }
        )
      )
    );

    const sent = results.filter(Boolean).length;
    console.log(`✅ broadcastToCity ${cityId}: ${sent}/${tokens.length} delivered`);
    return sent > 0;
  }

  /**
   * Broadcast notification to all couriers (SUPER_ADMIN, SPOTS_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async broadcastToCouriers(
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Arg('language', { defaultValue: 'pl' }) language: 'pl' | 'en' | 'ua' = 'pl'
  ): Promise<boolean> {
    return FCMService.sendToTopic(
      'couriers',
      NotificationType.SPOT_ANNOUNCEMENT,
      language,
      {
        spotName: 'Gelato Admin',
        message: body,
      },
      {
        customTitle: title,
      }
    );
  }

  /**
   * Broadcast notification to spot staff (SUPER_ADMIN, SPOTS_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async broadcastToSpotStaff(
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Arg('language', { defaultValue: 'pl' }) language: 'pl' | 'en' | 'ua' = 'pl'
  ): Promise<boolean> {
    return FCMService.sendToTopic(
      'spot_staff',
      NotificationType.SPOT_ANNOUNCEMENT,
      language,
      {
        spotName: 'Gelato Admin',
        message: body,
      },
      {
        customTitle: title,
      }
    );
  }

  /**
   * Send notification to specific user (SUPER_ADMIN, SPOTS_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async sendNotificationToUser(
    @Arg('userId') userId: string,
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    const sent = await FCMService.sendToUser(
      userId,
      NotificationType.SPOT_ANNOUNCEMENT,
      {
        spotName: 'Gelato Admin',
        message: body,
      },
      {
        customTitle: title,
      },
      prisma
    );

    return sent > 0;
  }
}
