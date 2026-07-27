import { PrismaClient } from '@prisma/client';
import { FCMService, NotificationType } from './FCMService';

/**
 * A single event notification that reaches a user in TWO places:
 *   1. a persisted `Notification` row (the in-app bell list / notification center)
 *   2. an FCM push (delivered to the device)
 *
 * The two used to be wired independently, which meant most events pushed but
 * left the bell empty (or vice-versa). `NotifyService` is the one choke point
 * that always does both, so push and bell can never drift.
 *
 * Why the caller supplies BOTH `persistType` and `fcmType`:
 * historically the persisted `type` string (what the mobile bell/detail screens
 * switch on, e.g. `'order'`) differs from the FCM enum (which selects the
 * localized push template, e.g. `ORDER_READY`). Rather than hide that behind a
 * lossy lookup, the caller states both explicitly and mirrors the deep-link
 * discriminator + entity ids into `fcmData` so the tapped-push handler and the
 * bell row agree on where to navigate.
 */
export interface NotifyInput {
  /** Persisted `Notification.type` — the mobile bell/detail screens switch on this. */
  persistType: string;
  /** FCM enum — selects the localized push template + sets push `data.type`. */
  fcmType: NotificationType;
  /** English title/body stored on the bell row (apps may re-localize from type+data). */
  title: string;
  body: string;
  /** Rich JSON payload for the bell row (e.g. { orderId, orderNumber, status }). */
  data?: Record<string, unknown>;
  imageUrl?: string;
  /** Template variables for the localized FCM push (all strings). */
  fcmVariables?: Record<string, string>;
  /** Extra FCM `data` (all strings) — mirror the deep-link kind + ids here. */
  fcmData?: Record<string, string>;
}

export class NotifyService {
  /**
   * Persist a bell row for one user AND push to their devices. Best-effort:
   * never throws, never blocks the calling mutation — failures are logged.
   */
  static async notifyUser(
    userId: string,
    input: NotifyInput,
    prisma: PrismaClient,
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: input.title,
          body: input.body,
          type: input.persistType,
          data: (input.data ?? undefined) as never,
          imageUrl: input.imageUrl ?? null,
        },
      });
    } catch (e) {
      console.error(`NotifyService: failed to persist notification for ${userId}:`, e);
    }

    try {
      await FCMService.sendToUser(
        userId,
        input.fcmType,
        input.fcmVariables ?? {},
        input.fcmData ?? {},
        prisma,
      );
    } catch (e) {
      console.error(`NotifyService: failed to push notification to ${userId}:`, e);
    }
  }

  /**
   * Persist bell rows for many users (single `createMany`) AND push to each.
   * Best-effort throughout. Used for fan-out events (new order to staff,
   * news to a city's clients, delivery broadcast to online couriers).
   */
  static async notifyUsers(
    userIds: string[],
    input: NotifyInput,
    prisma: PrismaClient,
  ): Promise<void> {
    const unique = Array.from(new Set(userIds));
    if (unique.length === 0) return;

    try {
      await prisma.notification.createMany({
        data: unique.map((userId) => ({
          userId,
          title: input.title,
          body: input.body,
          type: input.persistType,
          data: (input.data ?? undefined) as never,
          imageUrl: input.imageUrl ?? null,
        })),
      });
    } catch (e) {
      console.error(`NotifyService: failed to persist notifications for ${unique.length} users:`, e);
    }

    try {
      await FCMService.sendToUsers(
        unique,
        input.fcmType,
        input.fcmVariables ?? {},
        input.fcmData ?? {},
        prisma,
      );
    } catch (e) {
      console.error(`NotifyService: failed to push notifications to ${unique.length} users:`, e);
    }
  }
}
