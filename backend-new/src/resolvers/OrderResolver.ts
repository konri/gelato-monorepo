import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  FieldResolver,
  Root,
  ObjectType,
  Field,
  Float,
} from 'type-graphql';
import { Role, OrderStatus, TransactionType } from '@prisma/client';
import { Context } from '../types/Context';
import { OrderType, CreateOrderInput } from '../types/OrderType';
import { PubSubService } from '../services/PubSubService';
import { PointsResolver } from './PointsResolver';
import { computeDiscount } from './PromoCodeResolver';

/**
 * Minimal spot info attached to an order (for the list + tracking map).
 */
@ObjectType()
class OrderSpotSummary {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  logoUrl?: string;
}

/**
 * Live courier position for an in-progress order (latest known point).
 */
@ObjectType()
class OrderCourierLocation {
  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field()
  timestamp!: Date;
}

/**
 * Order Management Resolver
 *
 * Handles order creation, checkout flow, and order management.
 *
 * Role-based access:
 * - CLIENT: Can create orders and view their own orders
 * - SPOT_ADMIN/EMPLOYEE: Can view and update orders for their spots
 * - SUPER_ADMIN/SPOTS_ADMIN: Full access to all orders
 */
@Resolver(() => OrderType)
export class OrderResolver {
  private pointsResolver = new PointsResolver();

  /**
   * Resolve the spot summary for an order (list + tracking map).
   */
  @FieldResolver(() => OrderSpotSummary, { nullable: true })
  async spot(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<OrderSpotSummary | null> {
    const spot = await prisma.spot.findUnique({ where: { id: order.spotId } });
    if (!spot) return null;
    return {
      id: spot.id,
      name: spot.name,
      address: spot.address,
      latitude: spot.latitude,
      longitude: spot.longitude,
      phone: spot.phone ?? undefined,
      logoUrl: spot.logoUrl ?? undefined,
    };
  }

  /**
   * Customer display name for admin order history ("for whom").
   */
  @FieldResolver(() => String, { nullable: true })
  async customerName(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (!user) return null;
    return user.name || [user.firstName, user.surname].filter(Boolean).join(' ') || user.email;
  }

  /**
   * Customer phone for admin order history.
   */
  @FieldResolver(() => String, { nullable: true })
  async customerPhone(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    return user?.phone ?? null;
  }

  /**
   * Courier display name for admin order history ("who delivered").
   */
  @FieldResolver(() => String, { nullable: true })
  async courierName(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    if (!order.courierId) return null;
    const courier = await prisma.user.findUnique({ where: { id: order.courierId } });
    if (!courier) return null;
    return courier.name || [courier.firstName, courier.surname].filter(Boolean).join(' ') || courier.email;
  }

  /**
   * Latest courier position for an in-progress order (null if none yet).
   */
  @FieldResolver(() => OrderCourierLocation, { nullable: true })
  async courierLocation(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<OrderCourierLocation | null> {
    if (!order.courierId) return null;
    const loc = await prisma.courierLocation.findFirst({
      where: { orderId: order.id },
      orderBy: { timestamp: 'desc' },
    });
    if (!loc) return null;
    return { latitude: loc.latitude, longitude: loc.longitude, timestamp: loc.timestamp };
  }

  /**
   * Create a new order (checkout flow)
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => OrderType)
  async createOrder(
    @Arg('input') input: CreateOrderInput,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType> {
    const userId = req.user!.id;

    // 1. Validate spot exists and is active
    const spot = await prisma.spot.findUnique({
      where: { id: input.spotId },
    });

    if (!spot || !spot.isActive) {
      throw new Error('Spot not found or not active');
    }

    // 2. Validate delivery address is within delivery radius
    const distance = this.calculateDistance(
      input.deliveryLatitude,
      input.deliveryLongitude,
      spot.latitude,
      spot.longitude
    );

    if (distance > spot.deliveryRadiusKm) {
      throw new Error(`Delivery address is outside delivery radius (${spot.deliveryRadiusKm}km)`);
    }

    // 3. Validate and fetch items (tastes or products)
    if (input.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Each item references either a taste or a product (exactly one).
    const tasteIds = input.items
      .filter((item) => item.tasteId)
      .map((item) => item.tasteId as string);
    const productIds = input.items
      .filter((item) => item.productId)
      .map((item) => item.productId as string);

    if (input.items.some((item) => !item.tasteId === !item.productId)) {
      throw new Error('Each item must reference exactly one of tasteId or productId');
    }
    if (input.items.some((item) => item.quantity < 1)) {
      throw new Error('Item quantity must be at least 1');
    }

    // Fetch tastes and products belonging to this spot, with their real prices.
    const [tastes, products] = await Promise.all([
      tasteIds.length
        ? prisma.taste.findMany({
            where: { id: { in: tasteIds }, spotId: input.spotId, isAvailable: true, isActive: true },
          })
        : Promise.resolve([]),
      productIds.length
        ? prisma.product.findMany({
            where: { id: { in: productIds }, spotId: input.spotId, isAvailable: true, isActive: true },
          })
        : Promise.resolve([]),
    ]);

    if (tastes.length !== new Set(tasteIds).size || products.length !== new Set(productIds).size) {
      throw new Error('Some items are not available or do not exist');
    }

    const tasteMap = new Map(tastes.map((t) => [t.id, t]));
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Box products need their chosen tastes validated against the box limit.
    const boxTasteIdSet = new Set<string>();
    for (const item of input.items) {
      if (!item.productId) continue;
      const product = productMap.get(item.productId)!;
      if (product.isBox) {
        const chosen = item.boxTasteIds ?? [];
        if (chosen.length === 0) {
          throw new Error(`Box "${product.name}" requires at least one taste`);
        }
        if (product.maxTastes != null && chosen.length > product.maxTastes) {
          throw new Error(`Box "${product.name}" allows at most ${product.maxTastes} tastes`);
        }
        chosen.forEach((id) => boxTasteIdSet.add(id));
      } else if (item.boxTasteIds && item.boxTasteIds.length) {
        throw new Error('Only box products can include taste selections');
      }
    }
    // All box-selected tastes must exist at this spot and be available.
    if (boxTasteIdSet.size) {
      const boxTastes = await prisma.taste.count({
        where: {
          id: { in: Array.from(boxTasteIdSet) },
          spotId: input.spotId,
          isAvailable: true,
          isActive: true,
        },
      });
      if (boxTastes !== boxTasteIdSet.size) {
        throw new Error('A selected box taste is unavailable or does not exist');
      }
    }

    // 4. Calculate pricing from each item's own price.
    let subtotal = 0;
    const orderItems = input.items.map((item) => {
      const pricePerUnit = item.tasteId
        ? tasteMap.get(item.tasteId)!.price
        : productMap.get(item.productId as string)!.price;
      const total = pricePerUnit * item.quantity;
      subtotal += total;

      return {
        tasteId: item.tasteId ?? null,
        productId: item.productId ?? null,
        boxTasteIds: item.boxTasteIds ?? [],
        quantity: item.quantity,
        pricePerUnit,
        total,
      };
    });

    // Calculate delivery fee
    let deliveryFee = spot.deliveryFee;
    if (spot.freeDeliveryThreshold && subtotal >= spot.freeDeliveryThreshold) {
      deliveryFee = 0;
    }

    // 5. Apply promo / influencer code discount (server-side validated).
    let discount = 0;
    let appliedPromoId: string | null = null;
    if (input.promoCode) {
      const normalized = input.promoCode.trim().toUpperCase();
      const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
      const now = new Date();
      const usable =
        promo &&
        promo.isActive &&
        (!promo.validFrom || promo.validFrom <= now) &&
        (!promo.validUntil || promo.validUntil >= now) &&
        (promo.usageLimit == null || promo.usedCount < promo.usageLimit) &&
        (promo.minOrderValue == null || subtotal >= promo.minOrderValue);
      if (usable && promo) {
        discount = computeDiscount(promo, subtotal);
        appliedPromoId = promo.id;
      }
    }
    const pointsUsed = 0;

    // Calculate total (discount applies to items, not delivery)
    const total = Math.max(0, subtotal - discount) + deliveryFee;

    // 6. Generate order number (date-based sequential)
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    const orderNumber = `${datePrefix}-${String(todayOrders + 1).padStart(3, '0')}`;

    // 7. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          spotId: input.spotId,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          deliveryAddress: input.deliveryAddress,
          deliveryLatitude: input.deliveryLatitude,
          deliveryLongitude: input.deliveryLongitude,
          buildingType: input.buildingType,
          apartmentNumber: input.apartmentNumber,
          floor: input.floor,
          noteForCourier: input.deliveryNotes,
          noteForSpot: input.spotNotes,
          scheduledFor: input.scheduledFor,
          invoiceRequested: input.invoiceRequested ?? false,
          invoiceNIP: input.invoiceNIP,
          invoiceCompanyName: input.invoiceCompanyName,
          invoiceAddress: input.invoiceAddress,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({
          orderId: newOrder.id,
          ...item,
        })),
      });

      // Increment promo usage inside the same transaction.
      if (appliedPromoId) {
        await tx.promoCode.update({
          where: { id: appliedPromoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Fetch order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: true,
        },
      });
    });

    if (!order) {
      throw new Error('Failed to create order');
    }

    console.log(`✅ Order created: ${order.orderNumber} (${order.id}) for user ${userId} at spot ${input.spotId}`);

    // 8. Publish real-time events
    await PubSubService.publishOrderCreated(order);
    await PubSubService.publishNewOrderNotification(input.spotId, order);

    return order as OrderType;
  }

  /**
   * Get user's orders
   */
  @Authorized([Role.CLIENT])
  @Query(() => [OrderType])
  async myOrders(
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType[]> {
    const userId = req.user!.id;

    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderType[]>;
  }

  /**
   * Get single order by ID
   */
  @Authorized()
  @Query(() => OrderType, { nullable: true })
  async order(
    @Arg('id', () => ID) id: string,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType | null> {
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return null;
    }

    // Check permissions
    // CLIENT can only view their own orders
    if (user.roles.includes(Role.CLIENT) && order.userId !== user.id) {
      throw new Error('You can only view your own orders');
    }

    // SPOT_ADMIN/EMPLOYEE can view orders for their spots
    if (
      (user.roles.includes(Role.SPOT_ADMIN) || user.roles.includes(Role.EMPLOYEE)) &&
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      // Check if user has admin/employee profile for this spot
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: {
          userId: user.id,
          spotId: order.spotId,
        },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: {
          userId: user.id,
          spotId: order.spotId,
        },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only view orders for your spots');
      }
    }

    return order as OrderType;
  }

  /**
   * Get orders for a spot (for spot staff)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [OrderType])
  async spotOrders(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('status', () => OrderStatus, { nullable: true }) status: OrderStatus | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType[]> {
    const user = req.user!;

    // Check permission for SPOT_ADMIN/EMPLOYEE
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: {
          userId: user.id,
          spotId,
        },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: {
          userId: user.id,
          spotId,
        },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only view orders for your spots');
      }
    }

    const where: any = { spotId };
    if (status) {
      where.status = status;
    }

    return prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderType[]>;
  }

  /**
   * Claim an incoming order to prepare it (first-to-claim). The staff member who
   * claims it becomes responsible; the notification then disappears for everyone
   * else. Atomic guard on preparedById=null so only one claimer wins.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => OrderType)
  async claimOrder(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType> {
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { spotId: true },
    });
    if (!order) throw new Error('Order not found');

    // Staff must belong to this spot (admins bypass).
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId: order.spotId },
      });
      const employee = await prisma.employeeProfile.findFirst({
        where: { userId: user.id, spotId: order.spotId },
      });
      if (!spotAdmin && !employee) {
        throw new Error('You can only claim orders for your spot');
      }
    }

    const staffName =
      user.name || `${user.firstName || ''} ${user.surname || ''}`.trim() || user.email;

    // Atomic claim: only succeeds while unclaimed.
    const claim = await prisma.order.updateMany({
      where: { id: orderId, preparedById: null },
      data: {
        preparedById: user.id,
        preparedByName: staffName,
        claimedAt: new Date(),
        status: OrderStatus.PREPARING,
        acceptedAt: new Date(),
      },
    });
    if (claim.count === 0) {
      throw new Error('This order has already been claimed');
    }

    const claimed = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    // Tell other staff it's taken + push the status change to the client.
    await PubSubService.publishOrderClaimed(order.spotId, claimed);
    await PubSubService.publishOrderStatusChanged(claimed);

    console.log(`✅ Order ${orderId} claimed by ${staffName}`);
    return claimed as OrderType;
  }

  /**
   * Update order status (for spot staff)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async updateOrderStatus(
    @Arg('id', () => ID) id: string,
    @Arg('status', () => OrderStatus) status: OrderStatus,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      select: { spotId: true, userId: true, status: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check permission
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: {
          userId: user.id,
          spotId: order.spotId,
        },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: {
          userId: user.id,
          spotId: order.spotId,
        },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only update orders for your spots');
      }
    }

    // Update order with status timestamps
    const updateData: any = { status };

    switch (status) {
      case OrderStatus.PREPARING:
        updateData.acceptedAt = new Date();
        break;
      case OrderStatus.READY:
        updateData.readyAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: true,
      },
    });

    // If order is delivered, award loyalty points
    if (status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED) {
      // Award 1% of subtotal as points (1 PLN = 100 points)
      const pointsToAward = Math.floor(updatedOrder.subtotal * 1); // 1% = subtotal * 0.01 * 100 points

      if (pointsToAward > 0) {
        await this.awardOrderPoints(
          order.userId,
          pointsToAward,
          id,
          prisma
        );
      }

      // Check if this is referee's first order and award referral bonus
      await this.pointsResolver.awardReferralPoints(order.userId, id, prisma);

      // Send delivery confirmation email
      const { EmailService } = await import('../services/EmailService');
      await EmailService.sendOrderDelivered({
        email: updatedOrder.user.email,
        name: updatedOrder.user.firstName || updatedOrder.user.name || 'Customer',
        orderNumber: updatedOrder.orderNumber,
        orderId: updatedOrder.id,
        language: updatedOrder.user.language,
      });
    }

    // Publish order status change
    await PubSubService.publishOrderStatusChanged(updatedOrder);

    // When an order becomes READY and has no courier yet, broadcast it to the
    // spot's online couriers (first-to-accept model) + push-notify them.
    if (
      status === OrderStatus.READY &&
      order.status !== OrderStatus.READY &&
      !updatedOrder.courierId
    ) {
      await PubSubService.publishDeliveryBroadcast(updatedOrder.spotId, updatedOrder);
      await this.notifyOnlineCouriersOfDelivery(updatedOrder, prisma);
    }

    console.log(`✅ Order ${id} status updated: ${order.status} -> ${status}`);

    return true;
  }

  /**
   * Push-notify all online couriers currently working this order's spot.
   */
  private async notifyOnlineCouriersOfDelivery(order: any, prisma: any): Promise<void> {
    try {
      // Couriers with an active work session that selected this spot.
      const sessions = await prisma.workSession.findMany({
        where: { endedAt: null, selectedSpotIds: { has: order.spotId } },
        include: { courier: { select: { userId: true, isOnline: true } } },
      });

      const userIds = sessions
        .filter((s: any) => s.courier?.isOnline)
        .map((s: any) => s.courier.userId);

      if (userIds.length === 0) return;

      const { FCMService, NotificationType } = await import('../services/FCMService');
      await FCMService.sendToUsers(
        Array.from(new Set<string>(userIds)),
        NotificationType.ORDER_READY,
        { orderNumber: order.orderNumber },
        { orderId: order.id, spotId: order.spotId, kind: 'DELIVERY_BROADCAST' },
        prisma
      );
      console.log(`📢 Broadcast order ${order.id} to ${userIds.length} online courier(s)`);
    } catch (e) {
      console.error('Failed to notify couriers of delivery broadcast:', e);
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Award loyalty points for order
   */
  private async awardOrderPoints(
    userId: string,
    points: number,
    orderId: string,
    prisma: any
  ): Promise<void> {
    // Get or create balance
    let balance = await prisma.pointBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          lockedPoints: 0,
        },
      });
    }

    // Update balance
    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
      },
    });

    // Create transaction
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

    // Publish update
    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      points
    );

    console.log(`✅ Awarded ${points} loyalty points to user ${userId} for order ${orderId}`);
  }
}
