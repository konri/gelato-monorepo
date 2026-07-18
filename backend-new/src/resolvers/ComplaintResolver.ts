import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  ObjectType,
  Field,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';

/**
 * A customer complaint about an order, with customer + order context for
 * the spot's resolution queue.
 */
@ObjectType('Complaint')
export class ComplaintType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field({ nullable: true })
  orderNumber?: string;

  @Field(() => ID)
  userId!: string;

  @Field({ nullable: true })
  customerName?: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  subject!: string;

  @Field()
  message!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  resolution?: string;

  @Field({ nullable: true })
  resolvedAt?: Date;

  @Field()
  createdAt!: Date;
}

async function assertSpotAdmin(ctx: Context, spotId: string): Promise<void> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const admin = await ctx.prisma.spotAdminProfile.findFirst({
    where: { userId: user.id, spotId },
  });
  if (!admin) throw new Error('Only spot admins can manage complaints');
}

@Resolver()
export class ComplaintResolver {
  /**
   * A customer files a complaint about one of their orders.
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => ComplaintType)
  async createComplaint(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('subject') subject: string,
    @Arg('message') message: string,
    @Ctx() ctx: Context
  ): Promise<ComplaintType> {
    const userId = ctx.req.user!.id;
    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.userId !== userId) throw new Error('You can only complain about your own orders');

    const complaint = await ctx.prisma.complaint.create({
      data: {
        orderId,
        userId,
        spotId: order.spotId,
        courierId: order.courierId,
        subject,
        message,
      },
    });
    return complaint as unknown as ComplaintType;
  }

  /**
   * Complaints for a spot, newest first, optionally filtered by status.
   * Enriches each with the order number + customer name.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [ComplaintType])
  async spotComplaints(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('status', () => String, { nullable: true }) status: string | undefined,
    @Ctx() ctx: Context
  ): Promise<ComplaintType[]> {
    await assertSpotAdmin(ctx, spotId);
    const where: any = { spotId };
    if (status) where.status = status;

    const complaints = await ctx.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Batch-enrich with order number + customer name.
    const orderIds = Array.from(new Set(complaints.map((c) => c.orderId)));
    const userIds = Array.from(new Set(complaints.map((c) => c.userId)));
    const [orders, users] = await Promise.all([
      ctx.prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true },
      }),
      ctx.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, firstName: true, surname: true, email: true },
      }),
    ]);
    const orderMap = new Map(orders.map((o) => [o.id, o.orderNumber]));
    const userMap = new Map(
      users.map((u) => [
        u.id,
        u.name || [u.firstName, u.surname].filter(Boolean).join(' ') || u.email,
      ]),
    );

    return complaints.map((c) => ({
      ...c,
      orderNumber: orderMap.get(c.orderId),
      customerName: userMap.get(c.userId),
    })) as unknown as ComplaintType[];
  }

  /**
   * Resolve a complaint with a resolution note (SPOT_ADMIN).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => ComplaintType)
  async resolveComplaint(
    @Arg('id', () => ID) id: string,
    @Arg('resolution') resolution: string,
    @Ctx() ctx: Context
  ): Promise<ComplaintType> {
    const existing = await ctx.prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new Error('Complaint not found');
    await assertSpotAdmin(ctx, existing.spotId);

    const complaint = await ctx.prisma.complaint.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution,
        resolvedBy: ctx.req.user!.id,
        resolvedAt: new Date(),
      },
    });
    return complaint as unknown as ComplaintType;
  }
}
