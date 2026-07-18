import { Resolver, Subscription, Root, Arg, Ctx, Authorized, ObjectType, Field, ID } from 'type-graphql';
import { Role } from '@prisma/client';
import { PubSubService, SubscriptionTopic } from '../services/PubSubService';
import { Context } from '../types/Context';

/**
 * Courier Location Update Type
 */
@ObjectType()
class CourierLocationUpdate {
  @Field(() => ID)
  deliveryId!: string;

  @Field()
  latitude!: number;

  @Field()
  longitude!: number;

  @Field()
  timestamp!: Date;
}

/**
 * Points Update Type
 */
@ObjectType()
class PointsUpdate {
  @Field(() => ID)
  userId!: string;

  @Field()
  totalPoints!: number;

  @Field()
  availablePoints!: number;

  @Field()
  change!: number;
}

/**
 * New Order Notification Type
 */
@ObjectType()
class NewOrderNotification {
  @Field(() => ID)
  spotId!: string;

  @Field(() => String)
  order!: any; // OrderType - defined elsewhere, using String for now
}

/**
 * GraphQL Subscriptions Resolver
 *
 * Real-time event subscriptions for:
 * - Order tracking (clients)
 * - Courier location updates (clients)
 * - New order alerts (spot admins)
 * - Points updates (clients)
 * - Delivery tracking (couriers)
 */
@Resolver()
export class SubscriptionResolver {
  /**
   * Subscribe to order status changes
   * For clients tracking their order
   */
  @Authorized()
  @Subscription(() => String, {
    topics: SubscriptionTopic.ORDER_STATUS_CHANGED,
    filter: ({ payload, args, context }) => {
      // Only send updates for orders belonging to the authenticated user
      const user = context.req?.user;
      if (!user) return false;

      const order = payload.orderStatusChanged;
      return order.userId === user.id;
    },
  })
  orderStatusChanged(
    @Root() payload: any,
    @Ctx() context: Context
  ): any {
    return payload.orderStatusChanged;
  }

  /**
   * Subscribe to courier location updates
   * For clients tracking delivery
   */
  @Authorized()
  @Subscription(() => CourierLocationUpdate, {
    topics: SubscriptionTopic.COURIER_LOCATION_UPDATED,
    filter: async ({ payload, args, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      const { deliveryId } = payload.courierLocationUpdated;

      // Check if this delivery belongs to user's order
      const delivery = await context.prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true },
      });

      return delivery?.order.userId === user.id;
    },
  })
  courierLocationUpdated(
    @Root() payload: any
  ): CourierLocationUpdate {
    return payload.courierLocationUpdated;
  }

  /**
   * Subscribe to points updates
   * For clients tracking their loyalty points
   */
  @Authorized()
  @Subscription(() => PointsUpdate, {
    topics: SubscriptionTopic.POINTS_UPDATED,
    filter: ({ payload, args, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      return payload.pointsUpdated.userId === user.id;
    },
  })
  pointsUpdated(
    @Root() payload: any
  ): PointsUpdate {
    return payload.pointsUpdated;
  }

  /**
   * Subscribe to new order notifications
   * For spot admins and employees
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Subscription(() => String, {
    topics: SubscriptionTopic.NEW_ORDER_NOTIFICATION,
    filter: async ({ payload, args, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      const { spotId } = payload.newOrderNotification;

      // SUPER_ADMIN and SPOTS_ADMIN can see all orders
      if (
        user.roles.includes(Role.SUPER_ADMIN) ||
        user.roles.includes(Role.SPOTS_ADMIN)
      ) {
        return true;
      }

      // SPOT_ADMIN / EMPLOYEE — check they belong to this spot via their
      // profile rows (Spot has no admins/employees relation).
      const [admin, employee] = await Promise.all([
        context.prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
        context.prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
      ]);
      return !!admin || !!employee;
    },
  })
  newOrderNotification(
    @Root() payload: any
  ): string {
    // Serialize to a JSON string (the field is declared as String, and the
    // client JSON-parses it — returning a raw object breaks serialization).
    return JSON.stringify(payload.newOrderNotification);
  }

  /**
   * Spot staff subscribe to courier-reported delivery incidents / cancellations
   * for their spot. Returns the incident payload as a JSON string.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Subscription(() => String, {
    topics: SubscriptionTopic.DELIVERY_INCIDENT,
    filter: async ({ payload, context }) => {
      const user = context.req?.user;
      if (!user) return false;
      const { spotId } = payload.deliveryIncident;
      if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) {
        return true;
      }
      const [admin, employee] = await Promise.all([
        context.prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
        context.prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
      ]);
      return !!admin || !!employee;
    },
  })
  deliveryIncident(@Root() payload: any): string {
    return JSON.stringify(payload.deliveryIncident);
  }

  /**
   * Subscribe to order-claimed events (spot staff). When one staff member claims
   * an incoming order, everyone else's notification for it should disappear.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Subscription(() => String, {
    topics: SubscriptionTopic.ORDER_CLAIMED,
    filter: async ({ payload, context }) => {
      const user = context.req?.user;
      if (!user) return false;
      const { spotId } = payload.orderClaimed;

      if (
        user.roles.includes(Role.SUPER_ADMIN) ||
        user.roles.includes(Role.SPOTS_ADMIN)
      ) {
        return true;
      }

      const spotAdmin = await context.prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId },
      });
      const employee = await context.prisma.employeeProfile.findFirst({
        where: { userId: user.id, spotId },
      });
      return !!spotAdmin || !!employee;
    },
  })
  orderClaimed(@Root() payload: any): any {
    return JSON.stringify(payload.orderClaimed);
  }

  /**
   * Subscribe to delivery status changes
   * For couriers tracking their active deliveries
   */
  @Authorized([Role.COURIER])
  @Subscription(() => String, {
    topics: SubscriptionTopic.DELIVERY_STATUS_CHANGED,
    filter: async ({ payload, args, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      const delivery = payload.deliveryStatusChanged;

      // Only show deliveries assigned to this courier
      return delivery.courierId === user.id;
    },
  })
  deliveryStatusChanged(
    @Root() payload: any
  ): any {
    return payload.deliveryStatusChanged;
  }

  /**
   * Subscribe to order assignments
   * For couriers receiving new delivery assignments
   */
  @Authorized([Role.COURIER])
  @Subscription(() => String, {
    topics: SubscriptionTopic.ORDER_ASSIGNED,
    filter: ({ payload, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      const { courier } = payload.orderAssigned;
      return courier.id === user.id;
    },
  })
  orderAssigned(
    @Root() payload: any
  ): any {
    return payload.orderAssigned;
  }

  /**
   * Subscribe to courier application requests
   * For spot admins managing courier applications
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Subscription(() => String, {
    topics: SubscriptionTopic.COURIER_REQUEST,
    filter: async ({ payload, context }) => {
      const user = context.req?.user;
      if (!user) return false;

      const { spotId } = payload.courierRequest;

      // SUPER_ADMIN and SPOTS_ADMIN see all requests
      if (
        user.roles.includes(Role.SUPER_ADMIN) ||
        user.roles.includes(Role.SPOTS_ADMIN)
      ) {
        return true;
      }

      // SPOT_ADMIN - check if they manage this spot
      const managedSpot = await context.prisma.spot.findFirst({
        where: {
          id: spotId,
          admins: { some: { id: user.id } },
        },
      });

      return !!managedSpot;
    },
  })
  courierRequest(
    @Root() payload: any
  ): any {
    return payload.courierRequest;
  }

  /**
   * Subscribe to spot updates
   * For clients tracking their favorite spots
   */
  @Subscription(() => String, {
    topics: SubscriptionTopic.SPOT_UPDATED,
  })
  spotUpdated(
    @Root() payload: any
  ): any {
    return payload.spotUpdated;
  }

  /**
   * Subscribe to news publications
   * For all clients
   */
  @Subscription(() => String, {
    topics: SubscriptionTopic.NEWS_PUBLISHED,
  })
  newsPublished(
    @Root() payload: any
  ): any {
    return payload.newsPublished;
  }

  /**
   * Subscribe to delivery broadcasts (couriers).
   * Only couriers currently online with an active session that selected the
   * broadcasting spot receive the offer.
   */
  @Authorized([Role.COURIER])
  @Subscription(() => String, {
    topics: SubscriptionTopic.DELIVERY_BROADCAST,
    filter: async ({ payload, context }) => {
      const user = context.req?.user;
      if (!user) return false;
      const { spotId } = payload.deliveryBroadcast;

      const profile = await context.prisma.courierProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile || !profile.isOnline) return false;

      const session = await context.prisma.workSession.findFirst({
        where: { courierId: profile.id, endedAt: null },
      });
      return !!session && session.selectedSpotIds.includes(spotId);
    },
  })
  deliveryBroadcast(@Root() payload: any): any {
    return JSON.stringify(payload.deliveryBroadcast);
  }

  /**
   * Subscribe to delivery-claimed events (couriers) so a broadcast offer can
   * be removed from other couriers' pools once someone accepts it.
   */
  @Authorized([Role.COURIER])
  @Subscription(() => String, {
    topics: SubscriptionTopic.DELIVERY_CLAIMED,
  })
  deliveryClaimed(@Root() payload: any): any {
    return JSON.stringify(payload.deliveryClaimed);
  }
}
