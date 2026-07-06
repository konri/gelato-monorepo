import { PubSub } from 'graphql-subscriptions';

/**
 * Subscription Topics
 */
export enum SubscriptionTopic {
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // Delivery events
  DELIVERY_STATUS_CHANGED = 'DELIVERY_STATUS_CHANGED',
  COURIER_LOCATION_UPDATED = 'COURIER_LOCATION_UPDATED',
  DELIVERY_BROADCAST = 'DELIVERY_BROADCAST', // order ready → offered to online couriers
  DELIVERY_CLAIMED = 'DELIVERY_CLAIMED',     // an offered order was taken (remove from pools)

  // Point events
  POINTS_UPDATED = 'POINTS_UPDATED',

  // Admin events
  NEW_ORDER_NOTIFICATION = 'NEW_ORDER_NOTIFICATION',
  ORDER_CLAIMED = 'ORDER_CLAIMED', // a staff member claimed an order to prepare
  COURIER_REQUEST = 'COURIER_REQUEST',

  // Chat/messaging
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',

  // System events
  SPOT_UPDATED = 'SPOT_UPDATED',
  NEWS_PUBLISHED = 'NEWS_PUBLISHED',
}

/**
 * PubSub Service for GraphQL Subscriptions
 *
 * Manages real-time event broadcasting across:
 * - Order tracking (client and spot admin apps)
 * - Courier GPS location updates
 * - New order notifications for spots
 * - Point balance updates
 * - Chat messages
 */
export class PubSubService {
  private static instance: PubSub;

  /**
   * Get PubSub singleton instance
   */
  static getInstance(): PubSub {
    if (!this.instance) {
      this.instance = new PubSub();
      console.log('✅ PubSub service initialized');
    }
    return this.instance;
  }

  /**
   * Publish order created event
   */
  static async publishOrderCreated(order: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.ORDER_CREATED, {
      orderCreated: order,
    });
  }

  /**
   * Publish order status change
   */
  static async publishOrderStatusChanged(order: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.ORDER_STATUS_CHANGED, {
      orderStatusChanged: order,
    });
  }

  /**
   * Publish order assigned to courier
   */
  static async publishOrderAssigned(order: any, courier: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.ORDER_ASSIGNED, {
      orderAssigned: {
        order,
        courier,
      },
    });
  }

  /**
   * Publish delivery status change
   */
  static async publishDeliveryStatusChanged(delivery: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.DELIVERY_STATUS_CHANGED, {
      deliveryStatusChanged: delivery,
    });
  }

  /**
   * Publish courier location update
   */
  static async publishCourierLocationUpdated(
    deliveryId: string,
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.COURIER_LOCATION_UPDATED, {
      courierLocationUpdated: {
        deliveryId,
        latitude,
        longitude,
        timestamp,
      },
    });
  }

  /**
   * Publish points balance update
   */
  static async publishPointsUpdated(
    userId: string,
    totalPoints: number,
    availablePoints: number,
    change: number
  ): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.POINTS_UPDATED, {
      pointsUpdated: {
        userId,
        totalPoints,
        availablePoints,
        change,
      },
    });
  }

  /**
   * Publish new order notification to spot
   */
  static async publishNewOrderNotification(spotId: string, order: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.NEW_ORDER_NOTIFICATION, {
      newOrderNotification: {
        spotId,
        order,
      },
    });
  }

  /**
   * A staff member claimed an order to prepare it — so it disappears from the
   * other staff's incoming-order notifications.
   */
  static async publishOrderClaimed(spotId: string, order: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.ORDER_CLAIMED, {
      orderClaimed: { spotId, order },
    });
  }

  /**
   * Publish courier application request
   */
  static async publishCourierRequest(spotId: string, courier: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.COURIER_REQUEST, {
      courierRequest: {
        spotId,
        courier,
      },
    });
  }

  /**
   * Broadcast an order to all online couriers of a spot (first-to-accept model).
   */
  static async publishDeliveryBroadcast(spotId: string, order: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.DELIVERY_BROADCAST, {
      deliveryBroadcast: { spotId, order },
    });
  }

  /**
   * Signal that a broadcast order was claimed (so other couriers drop it).
   */
  static async publishDeliveryClaimed(spotId: string, orderId: string, courierId: string): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.DELIVERY_CLAIMED, {
      deliveryClaimed: { spotId, orderId, courierId },
    });
  }

  /**
   * Publish chat message
   */
  static async publishMessageReceived(
    orderId: string,
    message: any
  ): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.MESSAGE_RECEIVED, {
      messageReceived: {
        orderId,
        message,
      },
    });
  }

  /**
   * Publish spot updated event
   */
  static async publishSpotUpdated(spot: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.SPOT_UPDATED, {
      spotUpdated: spot,
    });
  }

  /**
   * Publish news published event
   */
  static async publishNewsPublished(news: any): Promise<void> {
    const pubsub = this.getInstance();
    await pubsub.publish(SubscriptionTopic.NEWS_PUBLISHED, {
      newsPublished: news,
    });
  }
}
