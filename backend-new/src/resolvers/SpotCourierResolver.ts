import {
  Resolver,
  Query,
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

/**
 * A courier approved to work for a spot, with live status + lifetime totals.
 */
@ObjectType()
class SpotCourierType {
  @Field(() => ID)
  courierId!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  photo?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  surname?: string;

  @Field()
  isOnline!: boolean;

  @Field()
  isAvailable!: boolean;

  @Field(() => Int)
  totalDeliveries!: number;

  @Field(() => Float)
  totalEarnings!: number;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  /** Is this courier currently working for THIS spot? */
  @Field()
  activeHere!: boolean;
}

/** A pending courier application to a spot, for the accept/reject queue. */
@ObjectType()
class SpotCourierApplicationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  courierId!: string;

  @Field()
  courierName!: string;

  @Field({ nullable: true })
  courierPhone?: string;

  @Field(() => Int)
  totalDeliveries!: number;

  @Field()
  status!: string;

  @Field()
  appliedAt!: Date;
}

/** One courier's earnings within a month, for the spot dashboard. */
@ObjectType()
class SpotCourierEarningType {
  @Field(() => ID)
  courierId!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => Int)
  deliveries!: number;
}

@ObjectType()
class SpotCourierEarningsSummaryType {
  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Int)
  totalDeliveries!: number;

  @Field(() => [SpotCourierEarningType])
  couriers!: SpotCourierEarningType[];
}

/** One past delivery a courier completed for a spot (detail screen history). */
@ObjectType()
class SpotCourierDeliveryType {
  @Field(() => ID)
  id!: string;

  @Field()
  orderNumber!: string;

  @Field()
  status!: string;

  @Field(() => Float)
  total!: number;

  @Field({ nullable: true })
  deliveryAddress?: string;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field()
  createdAt!: Date;
}

// Only staff who belong to the spot (or global admins) may view its couriers.
async function assertSpotAccess(ctx: Context, spotId: string): Promise<void> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const [admin, emp] = await Promise.all([
    ctx.prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
    ctx.prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
  ]);
  if (!admin && !emp) throw new Error('You do not have access to this spot');
}

const courierDisplayName = (u: {
  name: string | null;
  firstName: string | null;
  surname: string | null;
  email: string;
}) => u.name || [u.firstName, u.surname].filter(Boolean).join(' ') || u.email;

@Resolver()
export class SpotCourierResolver {
  /**
   * Couriers approved to work for a spot, with live online/available status.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [SpotCourierType])
  async spotCouriers(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() ctx: Context
  ): Promise<SpotCourierType[]> {
    await assertSpotAccess(ctx, spotId);
    const links = await ctx.prisma.courierSpot.findMany({
      where: { spotId, isActive: true },
      include: { courier: { include: { user: true } } },
    });
    return links.map((link) => {
      const c = link.courier;
      return {
        courierId: c.id,
        userId: c.userId,
        name: courierDisplayName(c.user),
        email: c.user.email ?? undefined,
        phone: c.user.phone ?? undefined,
        photo: c.user.profilePicture ?? undefined,
        firstName: c.user.firstName ?? undefined,
        surname: c.user.surname ?? undefined,
        isOnline: c.isOnline,
        isAvailable: c.isAvailable,
        totalDeliveries: c.totalDeliveries,
        totalEarnings: c.totalEarnings,
        averageRating: c.averageRating ?? undefined,
        activeHere: c.isOnline && c.currentSpotId === spotId,
      };
    });
  }

  /**
   * Pending courier applications awaiting review at a spot.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [SpotCourierApplicationType])
  async spotCourierApplications(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() ctx: Context
  ): Promise<SpotCourierApplicationType[]> {
    await assertSpotAccess(ctx, spotId);
    const apps = await ctx.prisma.courierApplication.findMany({
      where: { spotId, status: 'pending' },
      include: { courier: { include: { user: true } } },
      orderBy: { appliedAt: 'asc' },
    });
    return apps.map((a) => ({
      id: a.id,
      courierId: a.courierId,
      courierName: courierDisplayName(a.courier.user),
      courierPhone: a.courier.user.phone ?? undefined,
      totalDeliveries: a.courier.totalDeliveries,
      status: a.status,
      appliedAt: a.appliedAt,
    }));
  }

  /**
   * Courier earnings for a spot in a given month (default: current month).
   * Returns the aggregate plus a per-courier breakdown.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => SpotCourierEarningsSummaryType)
  async spotCourierEarnings(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('year', () => Int, { nullable: true }) year: number | undefined,
    @Arg('month', () => Int, { nullable: true }) month: number | undefined,
    @Ctx() ctx: Context
  ): Promise<SpotCourierEarningsSummaryType> {
    await assertSpotAccess(ctx, spotId);

    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month != null ? month - 1 : now.getMonth(); // month arg is 1-based
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);

    const earnings = await ctx.prisma.courierEarning.findMany({
      where: { spotId, date: { gte: start, lt: end } },
      include: { courier: { include: { user: true } } },
    });

    const byCourier = new Map<string, SpotCourierEarningType>();
    let totalAmount = 0;
    let totalDeliveries = 0;
    for (const e of earnings) {
      totalAmount += e.amount;
      totalDeliveries += 1;
      const bucket =
        byCourier.get(e.courierId) ?? {
          courierId: e.courierId,
          name: courierDisplayName(e.courier.user),
          amount: 0,
          deliveries: 0,
        };
      bucket.amount += e.amount;
      bucket.deliveries += 1;
      byCourier.set(e.courierId, bucket);
    }

    return {
      totalAmount,
      totalDeliveries,
      couriers: Array.from(byCourier.values()).sort((a, b) => b.amount - a.amount),
    };
  }

  /**
   * A courier's recent deliveries for a spot (detail screen history). Includes
   * finished + in-progress delivery orders assigned to this courier, newest
   * first. courierId is a CourierProfile id (matches Order.courierId).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [SpotCourierDeliveryType])
  async spotCourierDeliveries(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('courierId', () => ID) courierId: string,
    @Arg('limit', () => Int, { nullable: true }) limit: number | undefined,
    @Ctx() ctx: Context
  ): Promise<SpotCourierDeliveryType[]> {
    await assertSpotAccess(ctx, spotId);
    const orders = await ctx.prisma.order.findMany({
      where: { spotId, courierId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit ?? 50, 100),
    });
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      deliveryAddress: o.deliveryAddress ?? undefined,
      deliveredAt: o.deliveredAt ?? undefined,
      createdAt: o.createdAt,
    }));
  }
}
