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
import {
  ReviewType,
  PendingReviewType,
  PublicReviewType,
  SpotRatingSummaryType,
  CourierReviewType,
} from '../types/ReviewType';

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
   * Aggregate rating for a spot (average stars + review count). Public — shown
   * on the client spot page and the landing spot detail.
   */
  @Query(() => SpotRatingSummaryType)
  async spotRatingSummary(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { prisma }: Context
  ): Promise<SpotRatingSummaryType> {
    const agg = await prisma.review.aggregate({
      where: { spotId },
      _avg: { spotRating: true },
      _count: { _all: true },
    });
    return {
      averageRating: agg._avg.spotRating ?? undefined,
      reviewCount: agg._count._all,
    };
  }

  /**
   * Public list of a spot's reviews (newest first), with the reviewer's display
   * name but no user id/email. Only reviews that carry a comment are returned by
   * default so the list is meaningful.
   */
  @Query(() => [PublicReviewType])
  async spotReviews(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Ctx() { prisma }: Context
  ): Promise<PublicReviewType[]> {
    const reviews = await prisma.review.findMany({
      where: { spotId, comment: { not: null } },
      include: { user: { select: { firstName: true, surname: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return reviews.map((r) => {
      const first = r.user.firstName || r.user.name?.split(' ')[0] || 'Anonymous';
      const lastInitial = r.user.surname ? ` ${r.user.surname.charAt(0)}.` : '';
      return {
        id: r.id,
        rating: r.spotRating,
        comment: r.comment ?? undefined,
        authorName: `${first}${lastInitial}`,
        createdAt: r.createdAt,
      };
    });
  }

  /**
   * The signed-in courier's received reviews (their rating + client comment),
   * newest first — powers the courier app's reviews summary.
   */
  @Authorized([Role.COURIER])
  @Query(() => [CourierReviewType])
  async myCourierReviews(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierReviewType[]> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    if (!profile) return [];

    const reviews = await prisma.review.findMany({
      where: { courierRating: { not: null }, order: { courierId: profile.id } },
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.courierRating!,
      comment: r.comment ?? undefined,
      orderNumber: r.order.orderNumber,
      createdAt: r.createdAt,
    }));
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

    // Recompute the spot's cached rating aggregate (shown to clients + landing).
    const spotAgg = await prisma.review.aggregate({
      where: { spotId: order.spotId },
      _avg: { spotRating: true },
      _count: { _all: true },
    });
    await prisma.spot.update({
      where: { id: order.spotId },
      data: {
        averageRating: spotAgg._avg.spotRating ?? review.spotRating,
        reviewCount: spotAgg._count._all,
      },
    });

    console.log(`✅ Review created for order ${orderId}`);
    return review as ReviewType;
  }
}
