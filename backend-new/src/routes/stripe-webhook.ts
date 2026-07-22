import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from '../services/StripeService';
import { PubSubService } from '../services/PubSubService';
import { EmailService } from '../services/EmailService';
import { OrderPaymentService } from '../services/OrderPaymentService';

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

  // Shared commit path (idempotent) — also used by the confirmOrderPayment
  // mutation, so the order still reaches the spot without the webhook.
  await OrderPaymentService.markOrderPaid(orderId, paymentIntent.id, prisma);
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

  // Notify the user their payment failed (client listens on order status).
  await PubSubService.publishOrderStatusChanged(order);

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

  // Notify the user (client listens on order status).
  await PubSubService.publishOrderStatusChanged(order);
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

  // Notify the user (client listens on order status).
  const refreshed = await prisma.order.findUnique({ where: { id: order.id } });
  if (refreshed) await PubSubService.publishOrderStatusChanged(refreshed);

  // TODO: Send FCM push notification
}

export default router;
