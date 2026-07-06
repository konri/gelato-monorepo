import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
} from 'type-graphql';
import { Role, OrderStatus } from '@prisma/client';
import { Context } from '../types/Context';
import { ReviewType, PendingReviewType } from '../types/ReviewType';

// A client can review an order once, starting 1 hour after it was delivered.
const REVIEW_DELAY_MS = 60 * 60 * 1000;

/**
 * Review Resolver
 *
 * Clients rate a completed order (spot / courier / overall) ~1 hour after
 * delivery. Submitting a courier rating recomputes the courier's average.
 */
@Resolver()
export class ReviewResolver {
  /**
   * Delivered orders (>1h ago) the client hasn't reviewed yet — powers the
   * post-delivery rating prompt.
   */
  @Authorized([Role.CLIENT])
  @Query(() => [PendingReviewType])
  async pendingReviews(
    @Ctx() { req, prisma }: Context
  ): Promise<PendingReviewType[]> {
    const cutoff = new Date(Date.now() - REVIEW_DELAY_MS);

    const orders = await prisma.order.findMany({
      where: {
        userId: req.user!.id,
        status: OrderStatus.DELIVERED,
        deliveredAt: { lte: cutoff },
        review: null,
      },
      include: { spot: true },
      orderBy: { deliveredAt: 'desc' },
    });

    return orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      spotId: o.spotId,
      spotName: o.spot?.name ?? '',
      spotLogoUrl: o.spot?.logoUrl ?? undefined,
      hasCourier: !!o.courierId,
      deliveredAt: o.deliveredAt!,
    }));
  }

  /**
   * The current client's review for an order (null if not yet reviewed).
   */
  @Authorized([Role.CLIENT])
  @Query(() => ReviewType, { nullable: true })
  async myReview(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<ReviewType | null> {
    const review = await prisma.review.findUnique({ where: { orderId } });
    if (!review || review.userId !== req.user!.id) return null;
    return review as ReviewType;
  }

  /**
   * Create a review for a delivered order (client only). Rates the spot,
   * optionally the courier, and the overall experience. Recomputes the
   * courier's average rating when a courier rating is given.
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => ReviewType)
  async createReview(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('spotRating', () => Int) spotRating: number,
    @Arg('overallRating', () => Int) overallRating: number,
    @Arg('courierRating', () => Int, { nullable: true }) courierRating: number | undefined,
    @Arg('comment', () => String, { nullable: true }) comment: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<ReviewType> {
    const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, spotId: true, courierId: true, status: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== req.user!.id) {
      throw new Error('You can only review your own orders');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new Error('You can only review delivered orders');
    }

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) throw new Error('You already reviewed this order');

    const review = await prisma.review.create({
      data: {
        orderId,
        userId: req.user!.id,
        spotId: order.spotId,
        spotRating: clamp(spotRating),
        overallRating: clamp(overallRating),
        courierRating:
          courierRating != null && order.courierId ? clamp(courierRating) : null,
        comment: comment?.trim() || null,
      },
    });

    // Recompute the courier's average rating from all their courier ratings.
    if (review.courierRating != null && order.courierId) {
      const agg = await prisma.review.aggregate({
        where: {
          courierRating: { not: null },
          order: { courierId: order.courierId },
        },
        _avg: { courierRating: true },
      });
      await prisma.courierProfile.update({
        where: { id: order.courierId },
        data: { averageRating: agg._avg.courierRating ?? review.courierRating },
      });
    }

    console.log(`✅ Review created for order ${orderId}`);
    return review as ReviewType;
  }
}
