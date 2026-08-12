import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
  Float,
  ObjectType,
  Field,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';

// Only paid, non-cash orders are ever owed to a spot — a cash/pay-at-spot
// order was already collected by the spot directly at handover.
const OWED_ORDER_WHERE = {
  paymentStatus: 'paid',
  paymentMethod: { not: 'cash' },
};

@ObjectType()
class SpotPayoutSummaryType {
  @Field(() => ID)
  spotId!: string;

  @Field()
  spotName!: string;

  @Field(() => Float)
  amountOwed!: number;

  @Field(() => Int)
  orderCount!: number;

  @Field({ nullable: true })
  oldestUnpaidOrderAt?: Date;
}

@ObjectType()
class SpotPayoutType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  spotId!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => Int)
  orderCount!: number;

  @Field({ nullable: true })
  note?: string;

  @Field()
  paidAt!: Date;

  @Field(() => ID, { nullable: true })
  paidById?: string;
}

@Resolver()
export class PayoutResolver {
  /**
   * How much the platform currently owes each active spot for paid online
   * orders that haven't been settled in a SpotPayout yet. Spots with
   * nothing owed are omitted.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Query(() => [SpotPayoutSummaryType])
  async spotPayoutSummaries(@Ctx() { prisma }: Context): Promise<SpotPayoutSummaryType[]> {
    const owed = await prisma.order.groupBy({
      by: ['spotId'],
      where: { ...OWED_ORDER_WHERE, spotPayoutId: null },
      _sum: { subtotal: true },
      _count: { _all: true },
      _min: { createdAt: true },
    });

    if (owed.length === 0) return [];

    const spots = await prisma.spot.findMany({
      where: { id: { in: owed.map((o) => o.spotId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(spots.map((s) => [s.id, s.name]));

    return owed
      .filter((o) => (o._sum.subtotal ?? 0) > 0)
      .map((o) => ({
        spotId: o.spotId,
        spotName: nameById.get(o.spotId) ?? 'Unknown spot',
        amountOwed: o._sum.subtotal ?? 0,
        orderCount: o._count._all,
        oldestUnpaidOrderAt: o._min.createdAt ?? undefined,
      }))
      .sort((a, b) => b.amountOwed - a.amountOwed);
  }

  /**
   * Payout history for a single spot.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Query(() => [SpotPayoutType])
  async spotPayoutHistory(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { prisma }: Context
  ): Promise<SpotPayoutType[]> {
    return prisma.spotPayout.findMany({
      where: { spotId },
      orderBy: { paidAt: 'desc' },
    }) as Promise<SpotPayoutType[]>;
  }

  /**
   * Record that a spot has been paid out for all its currently-unpaid
   * online orders. Snapshots the amount/order count and links every
   * included order to the new SpotPayout so it can't be paid twice.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => SpotPayoutType)
  async createSpotPayout(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('note', () => String, { nullable: true }) note: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<SpotPayoutType> {
    const unpaidOrders = await prisma.order.findMany({
      where: { spotId, ...OWED_ORDER_WHERE, spotPayoutId: null },
      select: { id: true, subtotal: true },
    });

    if (unpaidOrders.length === 0) {
      throw new Error('No unpaid online orders for this spot');
    }

    const amount = unpaidOrders.reduce((sum, o) => sum + o.subtotal, 0);

    const payout = await prisma.spotPayout.create({
      data: {
        spotId,
        amount,
        orderCount: unpaidOrders.length,
        note,
        paidById: req.user!.id,
        orders: { connect: unpaidOrders.map((o) => ({ id: o.id })) },
      },
    });

    return payout as SpotPayoutType;
  }
}
