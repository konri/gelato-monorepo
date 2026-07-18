import { PrismaClient, TransactionType } from '@prisma/client';
import { PubSubService } from './PubSubService';

/**
 * Single, idempotent place that credits loyalty points for an order.
 *
 * Called from three paths, all of which must award exactly once:
 *  - Delivery order marked DELIVERED (spot staff / courier flow)
 *  - Pickup order paid up-front on Stripe success (pay-now)
 *  - Pickup order collected at the spot (pay-at-spot / cash)
 *
 * Idempotency is enforced by a conditional update on the `pointsAwarded`
 * flag (first-writer-wins), so concurrent callers can't double-award.
 */
export class OrderPointsService {
  // Points earned per order = subtotal (1 point per 1 PLN of items subtotal).
  static computeOrderPoints(subtotal: number): number {
    return Math.floor(subtotal);
  }

  /**
   * Award order points once. Returns the number of points awarded (0 if the
   * order already had points, wasn't found, or the subtotal rounds to 0).
   */
  static async awardOrderPointsIfNeeded(
    orderId: string,
    prisma: PrismaClient
  ): Promise<number> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, subtotal: true, pointsAwarded: true },
    });
    if (!order || order.pointsAwarded) return 0;

    const points = this.computeOrderPoints(order.subtotal);

    // Claim the award slot first (first-writer-wins). If another path already
    // flipped the flag, `count` is 0 and we stop — no double award.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, pointsAwarded: false },
      data: { pointsAwarded: true },
    });
    if (claimed.count === 0) return 0;

    if (points > 0) {
      await this.creditBalance(order.userId, points, orderId, prisma);
    }

    // Referral bonus fires on the referee's first completed order.
    await this.awardReferralPoints(order.userId, orderId, prisma);

    console.log(`✅ Awarded ${points} loyalty points to user ${order.userId} for order ${orderId}`);
    return points;
  }

  private static async creditBalance(
    userId: string,
    points: number,
    orderId: string,
    prisma: PrismaClient
  ): Promise<void> {
    let balance = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: { userId, totalPoints: 0, availablePoints: 0, lockedPoints: 0 },
      });
    }

    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId,
        type: TransactionType.EARNED,
        amount: points,
        description: 'Points earned from order',
        referenceId: orderId,
        referenceType: 'order',
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });

    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      points
    );
  }

  /**
   * Award the referrer 500 points when the referee completes their FIRST order.
   * "Completed" counts both DELIVERED (delivery) and COLLECTED (pickup).
   */
  private static async awardReferralPoints(
    referredUserId: string,
    orderId: string,
    prisma: PrismaClient
  ): Promise<void> {
    const completedCount = await prisma.order.count({
      where: { userId: referredUserId, status: { in: ['DELIVERED', 'COLLECTED'] } },
    });
    if (completedCount !== 1) return;

    const referral = await prisma.referral.findUnique({ where: { referredUserId } });
    if (!referral || referral.pointsAwarded) return;

    let balance = await prisma.pointBalance.findUnique({ where: { userId: referral.referrerId } });
    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: { userId: referral.referrerId, totalPoints: 0, availablePoints: 0, lockedPoints: 0 },
      });
    }
    const newBalance = await prisma.pointBalance.update({
      where: { userId: referral.referrerId },
      data: { totalPoints: { increment: 500 }, availablePoints: { increment: 500 } },
    });
    await prisma.pointTransaction.create({
      data: {
        userId: referral.referrerId,
        type: TransactionType.REFERRAL,
        amount: 500,
        description: 'Referral bonus - friend completed first order',
        referenceId: orderId,
        referenceType: 'order',
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });
    await prisma.referral.update({
      where: { referredUserId },
      data: { pointsAwarded: true },
    });
    await PubSubService.publishPointsUpdated(
      referral.referrerId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      500
    );
    console.log(`✅ Awarded referral bonus: 500 points to ${referral.referrerId} for ${referredUserId}'s first order`);
  }
}
