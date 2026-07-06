import Stripe from 'stripe';

export class StripeService {
  private static stripe: Stripe;

  static initialize() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      console.warn('STRIPE_SECRET_KEY not set - Stripe payments disabled');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
    });

    console.log('✅ Stripe initialized');
  }

  static getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe;
  }

  /**
   * Create a payment intent for an order
   */
  static async createPaymentIntent(
    amount: number, // in PLN cents (e.g., 1000 = 10.00 PLN)
    currency: string = 'pln',
    metadata: {
      orderId: string;
      userId: string;
      spotId: string;
    }
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripe();
    return await stripe.paymentIntents.confirm(paymentIntentId);
  }

  /**
   * Retrieve a payment intent
   */
  static async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Create a refund for a payment
   */
  static async createRefund(
    paymentIntentId: string,
    amount?: number, // optional partial refund amount
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    const stripe = this.getStripe();

    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    });
  }

  /**
   * Construct webhook event from raw body and signature
   */
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    const stripe = this.getStripe();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Create a customer
   */
  static async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    const stripe = this.getStripe();

    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  /**
   * Attach a payment method to a customer
   */
  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    const stripe = this.getStripe();

    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * List customer's payment methods
   */
  static async listPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    const stripe = this.getStripe();

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  }

  /**
   * Detach a payment method
   */
  static async detachPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    const stripe = this.getStripe();
    return await stripe.paymentMethods.detach(paymentMethodId);
  }
}
