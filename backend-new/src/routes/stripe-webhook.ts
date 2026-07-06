import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from '../services/StripeService';
// import { WebSocketService } from '../services/WebSocketService'; // TODO: Create WebSocketService
import { EmailService } from '../services/EmailService';

const router = Router();
const prisma = new PrismaClient();

/**
 * Stripe webhook endpoint
 * IMPORTANT: This endpoint needs raw body, not JSON parsed
 */
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Construct event from raw body
      event = StripeService.constructWebhookEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Webhook processing failed');
    }
  }
);

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      paymentIntentId: paymentIntent.id,
    },
    include: {
      user: true,
      spot: true,
      items: {
        include: {
          taste: true,
        },
      },
    },
  });

  console.log(`✅ Payment succeeded for order ${order.orderNumber}`);

  // Send WebSocket notification to user
  WebSocketService.sendToUser(order.userId, {
    type: 'PAYMENT_SUCCESS',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: 'Payment confirmed! Your order is being prepared.',
  });

  // Send notification to spot
  WebSocketService.sendToSpot(order.spotId, {
    type: 'NEW_ORDER',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: `New order ${order.orderNumber} received!`,
  });

  // Send order confirmation email
  await EmailService.sendOrderConfirmation({
    email: order.user.email,
    name: order.user.firstName || order.user.name || 'Customer',
    orderNumber: order.orderNumber,
    orderId: order.id,
    items: order.items.map((item) => ({
      name: item.taste.title,
      quantity: item.quantity,
      price: item.pricePerUnit,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    deliveryAddress: order.deliveryAddress,
    estimatedDelivery: '30-45 minutes',
    spotName: order.spot.name,
    language: order.user.language,
  });

  // TODO: Send FCM push notification to user
  // TODO: Send FCM push notification to spot admins
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'failed',
      paymentIntentId: paymentIntent.id,
    },
    include: {
      user: true,
    },
  });

  console.log(`❌ Payment failed for order ${order.orderNumber}`);

  // Send WebSocket notification to user
  WebSocketService.sendToUser(order.userId, {
    type: 'PAYMENT_FAILED',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: 'Payment failed. Please try again or use a different payment method.',
  });

  // Send payment failed email
  await EmailService.sendPaymentFailed({
    email: order.user.email,
    name: order.user.firstName || order.user.name || 'Customer',
    orderNumber: order.orderNumber,
    orderId: order.id,
    total: order.total,
    errorMessage: paymentIntent.last_payment_error?.message,
    language: order.user.language,
  });

  // TODO: Send FCM push notification to user
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'canceled',
      status: 'CANCELLED',
    },
  });

  console.log(`⚠️ Payment canceled for order ${order.orderNumber}`);

  // Send WebSocket notification
  WebSocketService.sendToUser(order.userId, {
    type: 'PAYMENT_CANCELED',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: 'Payment was canceled.',
  });
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('No payment intent in charge');
    return;
  }

  // Find order by payment intent ID
  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
    include: { user: true },
  });

  if (!order) {
    console.error(`No order found for payment intent ${paymentIntentId}`);
    return;
  }

  // Update order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'refunded',
    },
  });

  console.log(`💰 Refund processed for order ${order.orderNumber}`);

  // Send notification
  WebSocketService.sendToUser(order.userId, {
    type: 'PAYMENT_REFUNDED',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: 'Your payment has been refunded.',
  });

  // TODO: Send FCM push notification
}

export default router;
