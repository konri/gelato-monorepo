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
import { Role, OrderStatus, FulfillmentType } from '@prisma/client';
import { Context } from '../types/Context';
import { OrderType, OrderItemType, CreateOrderInput, CollectOrderResult } from '../types/OrderType';
import { PubSubService } from '../services/PubSubService';
import { computeDiscount } from './PromoCodeResolver';
import { OrderPointsService } from '../services/OrderPointsService';
import { CodeGenerator } from '../shared/utils/CodeGenerator';

/**
 * Persist an in-app notification for every staff member of a spot when a new
 * order lands, so the spot's notification bell populates (the pubsub event only
 * drives the live queue modal — it doesn't survive a reload). Best-effort.
 */
export async function persistNewOrderNotification(
  spotId: string,
  order: { id: string; orderNumber: string },
  prisma: Context['prisma'],
): Promise<void> {
  const [admins, employees] = await Promise.all([
    prisma.spotAdminProfile.findMany({ where: { spotId }, select: { userId: true } }),
    prisma.employeeProfile.findMany({ where: { spotId }, select: { userId: true } }),
  ]);
  const userIds = Array.from(
    new Set<string>([...admins.map((a) => a.userId), ...employees.map((e) => e.userId)]),
  );
  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((uid) => ({
      userId: uid,
      title: 'New order',
      body: `Order #${order.orderNumber} is waiting to be claimed.`,
      type: 'order',
      data: { orderId: order.id, orderNumber: order.orderNumber },
    })),
  });
}

/**
 * Resolves human-readable names for order line items so spot staff can see
 * what to prepare (taste titles / product names / box scoop choices).
 */
@Resolver(() => OrderItemType)
export class OrderItemResolver {
  @FieldResolver(() => String, { nullable: true })
  async displayName(
    @Root() item: OrderItemType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    if (item.tasteId) {
      const taste = await prisma.taste.findUnique({
        where: { id: item.tasteId },
        select: { title: true },
      });
      return taste?.title ?? null;
    }
    if (item.productId) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });
      return product?.name ?? null;
    }
    return null;
  }

  @FieldResolver(() => [String])
  async boxTasteNames(
    @Root() item: OrderItemType,
    @Ctx() { prisma }: Context
  ): Promise<string[]> {
    if (!item.boxTasteIds || item.boxTasteIds.length === 0) return [];
    const tastes = await prisma.taste.findMany({
      where: { id: { in: item.boxTasteIds } },
      select: { id: true, title: true },
    });
    const byId = new Map(tastes.map((t) => [t.id, t.title]));
    // Preserve order + repeats (one entry per chosen scoop).
    return item.boxTasteIds.map((id) => byId.get(id) ?? '—');
  }
}

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
   * The assigned courier's user record. NOTE: order.courierId is a
   * CourierProfile id, so we resolve profile → user (a direct user lookup by
   * courierId returns nothing).
   */
  private async courierUser(order: OrderType, prisma: Context['prisma']) {
    if (!order.courierId) return null;
    const profile = await prisma.courierProfile.findUnique({
      where: { id: order.courierId },
      include: { user: true },
    });
    return profile?.user ?? null;
  }

  /**
   * Courier display name shown to the client + spot ("who's delivering").
   */
  @FieldResolver(() => String, { nullable: true })
  async courierName(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const courier = await this.courierUser(order, prisma);
    if (!courier) return null;
    return courier.name || [courier.firstName, courier.surname].filter(Boolean).join(' ') || courier.email;
  }

  /**
   * Courier's profile photo (selfie) URL, shown to the client + spot.
   */
  @FieldResolver(() => String, { nullable: true })
  async courierPhoto(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const courier = await this.courierUser(order, prisma);
    return courier?.profilePicture ?? null;
  }

  /**
   * Assigned courier's phone (so the spot can call the courier, not itself).
   */
  @FieldResolver(() => String, { nullable: true })
  async courierPhone(
    @Root() order: OrderType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const courier = await this.courierUser(order, prisma);
    return courier?.phone ?? null;
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

    const fulfillmentType = input.fulfillmentType ?? FulfillmentType.DELIVERY;
    const isPickup = fulfillmentType === FulfillmentType.PICKUP;

    // 2. For delivery, require an address within the spot's delivery radius.
    //    Pickup orders skip this entirely (collected at the spot).
    if (!isPickup) {
      if (
        input.deliveryAddress == null ||
        input.deliveryLatitude == null ||
        input.deliveryLongitude == null
      ) {
        throw new Error('Delivery orders require a delivery address');
      }
      const distance = this.calculateDistance(
        input.deliveryLatitude,
        input.deliveryLongitude,
        spot.latitude,
        spot.longitude
      );
      if (distance > spot.deliveryRadiusKm) {
        throw new Error(`Delivery address is outside delivery radius (${spot.deliveryRadiusKm}km)`);
      }
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
      const menuItem = item.tasteId
        ? tasteMap.get(item.tasteId)!
        : productMap.get(item.productId as string)!;
      const pricePerUnit = menuItem.price;
      // Snapshot the item's loyalty points now, so later menu edits don't
      // change what this order earns when it's eventually paid.
      const pointsPerUnit = (menuItem as { loyaltyPoints?: number }).loyaltyPoints ?? 0;
      const total = pricePerUnit * item.quantity;
      subtotal += total;

      return {
        tasteId: item.tasteId ?? null,
        productId: item.productId ?? null,
        boxTasteIds: item.boxTasteIds ?? [],
        quantity: item.quantity,
        pricePerUnit,
        pointsPerUnit,
        total,
      };
    });

    // Calculate delivery fee (pickup orders are never charged one).
    let deliveryFee = isPickup ? 0 : spot.deliveryFee;
    if (!isPickup && spot.freeDeliveryThreshold && subtotal >= spot.freeDeliveryThreshold) {
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

    // Handover codes for delivery orders: a spot→courier pickup code and a
    // client→courier 4-digit delivery PIN (nothing to hand over for pickup).
    const pickupCode = isPickup ? null : CodeGenerator.generateRandomString(4).toUpperCase();
    const deliveryPin = isPickup
      ? null
      : String(Math.floor(1000 + Math.random() * 9000));

    // 7. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          spotId: input.spotId,
          status: OrderStatus.PENDING,
          fulfillmentType,
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          // Pickup orders carry no address.
          deliveryAddress: isPickup ? null : input.deliveryAddress,
          deliveryLatitude: isPickup ? null : input.deliveryLatitude,
          deliveryLongitude: isPickup ? null : input.deliveryLongitude,
          buildingType: isPickup ? null : input.buildingType,
          apartmentNumber: isPickup ? null : input.apartmentNumber,
          floor: isPickup ? null : input.floor,
          noteForCourier: input.deliveryNotes,
          noteForSpot: input.spotNotes,
          pickupCode,
          deliveryPin,
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

    // 8. Publish real-time events.
    await PubSubService.publishOrderCreated(order);
    // Only alert the spot (queue modal + sound) once the order is actually
    // payable-committed: cash/pay-at-spot orders commit on create, while
    // pay-online orders are announced from the Stripe webhook on success — so
    // we don't disturb the spot before the customer has paid.
    if (order.paymentMethod === 'cash') {
      await PubSubService.publishNewOrderNotification(input.spotId, order);
      await persistNewOrderNotification(input.spotId, order, prisma).catch((e) =>
        console.error('Failed to persist new-order notification:', e),
      );
    }

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

    // Never surface a pay-online order to the spot until Stripe confirms
    // payment. Card orders start paymentStatus:'pending' and only the webhook
    // flips them to 'paid' — so a failed-then-retried card checkout no longer
    // dumps a duplicate unpaid order into the queue. Cash / pay-at-spot orders
    // (paymentMethod:'cash') commit immediately and are always shown.
    where.OR = [
      { paymentMethod: 'cash' },
      { paymentStatus: 'paid' },
      { paymentStatus: 'refunded' },
    ];

    return prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderType[]>;
  }

  /**
   * Orders that need spot attention in the last 24h: terminated / cancelled /
   * failed, plus delivery orders currently HELD by a courier incident (the
   * courier reported a problem and the spot must contact the client, refund, or
   * re-dispatch a fresh pack). Distinct from the live prepare queue.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [OrderType])
  async spotAttentionOrders(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType[]> {
    await this.assertCanManageSpot(req.user!, spotId, prisma);

    // 24h window (updatedAt keeps recently-actioned orders visible).
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.order.findMany({
      where: {
        spotId,
        updatedAt: { gte: since },
        OR: [
          { status: { in: [OrderStatus.TERMINATED, OrderStatus.CANCELLED, OrderStatus.FAILED] } },
          // Incident-held: reported by a courier and not yet re-dispatched
          // (still PREPARING, no courier assigned) — needs a spot decision.
          {
            incidentReportedAt: { not: null },
            status: OrderStatus.PREPARING,
            courierId: null,
          },
        ],
      },
      include: {
        items: true,
      },
      orderBy: { updatedAt: 'desc' },
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
      case OrderStatus.COLLECTED:
        updateData.collectedAt = new Date();
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

    // Order reached a terminal "completed" status — award loyalty points once.
    // (Idempotent via the pointsAwarded guard, so a prior pay-now award for a
    // pickup order won't double up here.)
    const becameComplete =
      (status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED) ||
      (status === OrderStatus.COLLECTED && order.status !== OrderStatus.COLLECTED);
    if (becameComplete) {
      await OrderPointsService.awardOrderPointsIfNeeded(id, prisma);

      // Send delivery confirmation email (delivery only).
      if (status === OrderStatus.DELIVERED) {
        const { EmailService } = await import('../services/EmailService');
        await EmailService.sendOrderDelivered({
          email: updatedOrder.user.email,
          name: updatedOrder.user.firstName || updatedOrder.user.name || 'Customer',
          orderNumber: updatedOrder.orderNumber,
          orderId: updatedOrder.id,
          language: updatedOrder.user.language,
        });
      }
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
   * Terminate an order from the spot side (e.g. run out of a flavor, closing).
   * Unlike a plain cancel: the customer is refunded (if they paid online) but
   * KEEPS any loyalty points for the order, sees an apologetic message, and the
   * order shows the distinct TERMINATED status. Spot staff of the order's spot
   * (or global admins) only.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async terminateOrder(
    @Arg('id', () => ID) id: string,
    @Arg('reason', () => String, { nullable: true }) reason: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        spotId: true,
        userId: true,
        status: true,
        orderNumber: true,
        total: true,
        paymentIntentId: true,
        paymentStatus: true,
      },
    });
    if (!order) throw new Error('Order not found');

    // Already finished orders can't be terminated.
    const finished: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.COLLECTED,
      OrderStatus.CANCELLED,
      OrderStatus.FAILED,
      OrderStatus.TERMINATED,
    ];
    if (finished.includes(order.status)) {
      throw new Error('This order can no longer be terminated');
    }

    // Permission: global admins pass; otherwise must manage the order's spot.
    if (!user.roles.includes(Role.SUPER_ADMIN) && !user.roles.includes(Role.SPOTS_ADMIN)) {
      const [spotAdmin, employee] = await Promise.all([
        prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId: order.spotId } }),
        prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId: order.spotId } }),
      ]);
      if (!spotAdmin && !employee) throw new Error('You can only terminate orders for your spots');
    }

    // Refund online payments (best-effort — don't block termination on Stripe).
    let refundedAt: Date | null = null;
    if (order.paymentIntentId && order.paymentStatus !== 'refunded') {
      try {
        const { StripeService } = await import('../services/StripeService');
        await StripeService.createRefund(order.paymentIntentId, undefined, 'requested_by_customer');
        refundedAt = new Date();
      } catch (e) {
        console.error(`Refund failed for terminated order ${order.orderNumber}:`, e);
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.TERMINATED,
        terminatedAt: new Date(),
        terminationReason: reason ?? null,
        cancelledAt: new Date(),
        ...(refundedAt ? { refundedAt, paymentStatus: 'refunded' } : {}),
      },
      include: { items: true, user: true },
    });

    // Customer keeps loyalty points for the order (per spec) — award if not yet.
    await OrderPointsService.awardOrderPointsIfNeeded(id, prisma).catch((e) =>
      console.error('Point award on termination failed:', e),
    );

    // Tell the client (live status + persisted notification + push + email).
    await PubSubService.publishOrderStatusChanged(updated);
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: 'Order cancelled',
        body: `We're sorry — order #${order.orderNumber} was cancelled by the spot. Your refund is on its way, and your loyalty points have been kept.`,
        type: 'order',
        data: { orderId: id, orderNumber: order.orderNumber, terminated: true },
      },
    });
    try {
      const { FCMService, NotificationType } = await import('../services/FCMService');
      await FCMService.sendToUser(
        order.userId,
        NotificationType.ORDER_CANCELLED,
        { orderId: order.orderNumber },
        { kind: 'TERMINATED', orderId: id },
        prisma,
      );
    } catch (e) {
      console.error('Termination push failed:', e);
    }

    console.log(`🛑 Order ${order.orderNumber} terminated by ${user.email} (refunded=${!!refundedAt})`);
    return true;
  }

  /**
   * Re-dispatch a delivery order after a courier incident. The spot has
   * prepared a fresh pack, so we clear the incident hold and put the order back
   * in the courier pool (status → READY). The courier who reported the incident
   * still can't re-accept it (incidentReportedBy is preserved).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async redispatchOrder(
    @Arg('id', () => ID) id: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { spotId: true, status: true, orderNumber: true, fulfillmentType: true, courierId: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.fulfillmentType !== FulfillmentType.DELIVERY) {
      throw new Error('Only delivery orders are dispatched to couriers');
    }
    // Only an order that's been pulled from a courier (held after an incident)
    // and isn't currently assigned should be re-dispatched.
    if (order.status !== OrderStatus.PREPARING || order.courierId) {
      throw new Error('This order is not awaiting re-dispatch');
    }
    await this.assertCanManageSpot(req.user!, order.spotId, prisma);

    const updated = await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.READY, readyAt: new Date() },
      include: { items: true },
    });

    // Back in the pool → notify online couriers + drive the live queue.
    await PubSubService.publishOrderStatusChanged(updated);
    await PubSubService.publishDeliveryBroadcast(order.spotId, updated);
    await this.notifyOnlineCouriersOfDelivery(updated, prisma);

    console.log(`🔁 Order ${order.orderNumber} re-dispatched to couriers`);
    return true;
  }

  /**
   * Pickup orders for a customer that are ready to be collected at a spot.
   * Used by the spot app after scanning the customer's loyalty QR/code.
   * Returns non-terminal PICKUP orders at this spot for that customer.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [OrderType])
  async collectablePickupOrders(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('userId', () => ID) userId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<OrderType[]> {
    await this.assertCanManageSpot(req.user!, spotId, prisma);

    const orders = await prisma.order.findMany({
      where: {
        spotId,
        userId,
        fulfillmentType: FulfillmentType.PICKUP,
        status: { notIn: [OrderStatus.COLLECTED, OrderStatus.CANCELLED, OrderStatus.FAILED] },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    return orders as unknown as OrderType[];
  }

  /**
   * Mark a pickup order collected at the spot. For pay-at-spot (cash) orders
   * this also marks the order paid and awards loyalty points (points are only
   * granted for cash orders on collection). Pay-now orders were already paid +
   * awarded, so this just finalizes the status.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => CollectOrderResult)
  async collectPickupOrder(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<CollectOrderResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        spotId: true,
        status: true,
        fulfillmentType: true,
        paymentStatus: true,
      },
    });
    if (!order) throw new Error('Order not found');
    if (order.fulfillmentType !== FulfillmentType.PICKUP) {
      throw new Error('Only pickup orders can be collected');
    }
    if (order.status === OrderStatus.COLLECTED) {
      throw new Error('This order was already collected');
    }
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED) {
      throw new Error('This order cannot be collected');
    }

    await this.assertCanManageSpot(req.user!, order.spotId, prisma);

    // Cash orders are settled in person at collection.
    const markPaid = order.paymentStatus !== 'paid';

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COLLECTED,
        collectedAt: new Date(),
        ...(markPaid ? { paymentStatus: 'paid' } : {}),
      },
      include: { items: true, user: true },
    });

    // Award points once (idempotent). Pay-now pickups already awarded on the
    // Stripe webhook, so this returns 0 for them.
    const pointsAwarded = await OrderPointsService.awardOrderPointsIfNeeded(orderId, prisma);

    await PubSubService.publishOrderStatusChanged(updated);

    console.log(`✅ Pickup order ${order.orderNumber} collected (points awarded: ${pointsAwarded})`);

    return {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      pointsAwarded,
    };
  }

  /**
   * Shared permission check: global admins pass; otherwise the caller must be
   * a spot admin or employee of the given spot.
   */
  private async assertCanManageSpot(user: any, spotId: string, prisma: any): Promise<void> {
    if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) {
      return;
    }
    const [spotAdmin, employee] = await Promise.all([
      prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
      prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
    ]);
    if (!spotAdmin && !employee) {
      throw new Error('You can only manage orders for your spots');
    }
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

}
