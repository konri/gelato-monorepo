import { PrismaClient } from '@prisma/client';
import { PubSubService } from './PubSubService';
import { EmailService } from './EmailService';
import { OrderPointsService } from './OrderPointsService';
import { persistNewOrderNotification } from '../resolvers/OrderResolver';

/**
 * Single place that commits an order once its online payment has succeeded.
 *
 * Called from BOTH the Stripe webhook (payment_intent.succeeded) AND the
 * client-driven `confirmOrderPayment` mutation, so a paid order still reaches
 * the spot even when the webhook can't hit us (local dev / missing forwarding).
 * Idempotent: a second call after the order is already 'paid' is a no-op.
 */
export class OrderPaymentService {
  static async markOrderPaid(
    orderId: string,
    paymentIntentId: string | undefined,
    prisma: PrismaClient,
  ): Promise<boolean> {
    // Claim the paid transition atomically (first-writer-wins) so the webhook
    // and the mutation can't both announce the order / send two emails.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: 'paid' } },
      data: {
        paymentStatus: 'paid',
        ...(paymentIntentId ? { paymentIntentId } : {}),
      },
    });
    if (claimed.count === 0) {
      return false; // already paid — nothing more to do
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        spot: true,
        items: { include: { taste: true, product: true } },
      },
    });
    if (!order) return false;

    console.log(`✅ Payment committed for order ${order.orderNumber}`);

    // Pickup orders paid online earn loyalty points now; delivery earns on
    // DELIVERED. Idempotent via the pointsAwarded guard.
    if (order.fulfillmentType === 'PICKUP') {
      await OrderPointsService.awardOrderPointsIfNeeded(order.id, prisma);
    }

    // Announce to the client (status) and the spot (new-order queue + bell).
    await PubSubService.publishOrderStatusChanged(order);
    await PubSubService.publishNewOrderNotification(order.spotId, order);
    await persistNewOrderNotification(order.spotId, order, prisma).catch((e) =>
      console.error('Failed to persist new-order notification:', e),
    );

    // Order confirmation email (best-effort).
    await EmailService.sendOrderConfirmation({
      email: order.user.email,
      name: order.user.firstName || order.user.name || 'Customer',
      orderNumber: order.orderNumber,
      orderId: order.id,
      items: order.items.map((item) => ({
        name: item.taste?.title || item.product?.name || 'Item',
        quantity: item.quantity,
        price: item.pricePerUnit,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryAddress:
        order.fulfillmentType === 'PICKUP'
          ? `Pickup at ${order.spot.name}`
          : order.deliveryAddress ?? '',
      estimatedDelivery: order.fulfillmentType === 'PICKUP' ? 'Ready soon' : '30-45 minutes',
      spotName: order.spot.name,
      language: order.user.language,
    }).catch((e) => console.error('Failed to send order confirmation email:', e));

    return true;
  }
}
