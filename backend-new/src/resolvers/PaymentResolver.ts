import { Resolver, Mutation, Query, Arg, Ctx, Authorized, ID } from 'type-graphql';
import { PrismaClient } from '@prisma/client';
import { Context } from '../types/Context';
import { StripeService } from '../services/StripeService';
import { OrderPaymentService } from '../services/OrderPaymentService';

const prisma = new PrismaClient();

@Resolver()
export class PaymentResolver {
  /**
   * Create a Stripe payment intent for an order
   */
  @Authorized(['CLIENT'])
  @Mutation(() => String)
  async createPaymentIntent(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() context: Context
  ): Promise<string> {
    const userId = context.req.user!.id;

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        spot: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if order already has a payment intent
    if (order.paymentIntentId) {
      // Retrieve existing payment intent
      const existingIntent = await StripeService.getPaymentIntent(order.paymentIntentId);

      // If it's still in a usable state, return its client secret
      if (existingIntent.status === 'requires_payment_method' ||
          existingIntent.status === 'requires_confirmation' ||
          existingIntent.status === 'requires_action') {
        return existingIntent.client_secret!;
      }
    }

    // Convert total to cents (Stripe expects amount in smallest currency unit)
    const amountInCents = Math.round(order.total * 100);

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      amountInCents,
      'pln',
      {
        orderId: order.id,
        userId: order.userId,
        spotId: order.spotId,
      }
    );

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending',
      },
    });

    // Return client secret for mobile app to complete payment
    return paymentIntent.client_secret!;
  }

  /**
   * Confirm an order's payment straight after the Stripe PaymentSheet reports
   * success on the client. We re-verify the PaymentIntent with Stripe (never
   * trust the client's word) and then commit the order via the SAME path as the
   * webhook. This makes the order reach the spot immediately even when the
   * webhook can't reach us (local dev, missing forwarding, delayed delivery).
   * Idempotent — safe if the webhook also fires.
   */
  @Authorized(['CLIENT'])
  @Mutation(() => Boolean)
  async confirmOrderPayment(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() context: Context
  ): Promise<boolean> {
    const userId = context.req.user!.id;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.userId !== userId) throw new Error('Unauthorized');
    if (order.paymentStatus === 'paid') return true; // already committed
    if (!order.paymentIntentId) throw new Error('No payment intent for this order');

    // Verify with Stripe that the money actually moved.
    const intent = await StripeService.getPaymentIntent(order.paymentIntentId);
    if (intent.status !== 'succeeded') {
      throw new Error(`Payment not completed (status: ${intent.status})`);
    }

    await OrderPaymentService.markOrderPaid(orderId, order.paymentIntentId, prisma);
    return true;
  }

  /**
   * Get payment status for an order
   */
  @Authorized(['CLIENT'])
  @Query(() => String)
  async getPaymentStatus(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() context: Context
  ): Promise<string> {
    const userId = context.req.user!.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return order.paymentStatus;
  }

  /**
   * Cancel a payment intent
   */
  @Authorized(['CLIENT', 'SPOT_ADMIN', 'SPOTS_ADMIN', 'SUPER_ADMIN'])
  @Mutation(() => Boolean)
  async cancelPaymentIntent(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() context: Context
  ): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify authorization
    const isOwner = order.userId === context.req.user!.id;
    const isAdmin = context.req.user!.roles.some((r) =>
      ['SPOT_ADMIN', 'SPOTS_ADMIN', 'SUPER_ADMIN'].includes(r),
    );

    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized');
    }

    if (!order.paymentIntentId) {
      throw new Error('No payment intent to cancel');
    }

    // Cancel the payment intent on Stripe
    const stripe = StripeService.getStripe();
    await stripe.paymentIntents.cancel(order.paymentIntentId);

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'canceled',
        status: 'CANCELLED',
      },
    });

    return true;
  }

  /**
   * Create a refund for an order
   */
  @Authorized(['SPOT_ADMIN', 'SPOTS_ADMIN', 'SUPER_ADMIN'])
  @Mutation(() => Boolean)
  async refundOrder(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('amount', { nullable: true }) amount?: number, // optional partial refund
    @Arg('reason', { nullable: true }) reason?: string
  ): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.paymentIntentId) {
      throw new Error('No payment to refund');
    }

    if (order.paymentStatus !== 'paid') {
      throw new Error('Order payment not completed');
    }

    // Create refund
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    await StripeService.createRefund(
      order.paymentIntentId,
      refundAmount,
      reason as any
    );

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: refundAmount ? 'partially_refunded' : 'refunded',
      },
    });

    return true;
  }
}
