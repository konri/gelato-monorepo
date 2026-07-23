import { authGql, gql } from "./api";
import type { CreateOrderInput, DeliveryAvailability, OrderSummary } from "./types";

/**
 * Create an order (checkout). The server recomputes prices, promo, and
 * delivery — the returned totals are authoritative.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderSummary> {
  const data = await authGql<{ createOrder: OrderSummary }>(
    `mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        id
        orderNumber
        status
        fulfillmentType
        subtotal
        discount
        deliveryFee
        total
        paymentStatus
      }
    }`,
    { input },
  );
  return data.createOrder;
}

/**
 * Check whether a candidate address is within a spot's delivery radius, and
 * what the delivery fee would be. Public query (no auth needed).
 */
export async function checkDeliveryAvailability(
  spotId: string,
  latitude: number,
  longitude: number,
): Promise<DeliveryAvailability> {
  const data = await gql<{ checkDeliveryAvailability: DeliveryAvailability }>(
    `query CheckDelivery($spotId: ID!, $latitude: Float!, $longitude: Float!) {
      checkDeliveryAvailability(spotId: $spotId, latitude: $latitude, longitude: $longitude) {
        canDeliver
        distanceKm
        deliveryRadiusKm
        deliveryFee
        freeDeliveryThreshold
      }
    }`,
    { spotId, latitude, longitude },
  );
  return data.checkDeliveryAvailability;
}

/**
 * Create (or reuse) a Stripe PaymentIntent for an order and return its
 * client secret. The web checkout confirms this secret with Stripe.js —
 * the SAME backend flow the mobile app uses (mobile confirms via PaymentSheet).
 */
export async function createPaymentIntent(orderId: string): Promise<string> {
  const data = await authGql<{ createPaymentIntent: string }>(
    `mutation CreatePaymentIntent($orderId: ID!) {
      createPaymentIntent(orderId: $orderId)
    }`,
    { orderId },
  );
  return data.createPaymentIntent;
}

/**
 * Poll an order's payment status (paid | pending | failed | canceled | refunded).
 * Useful after redirect-based payment methods (BLIK, some wallets).
 */
export async function getPaymentStatus(orderId: string): Promise<string> {
  const data = await authGql<{ getPaymentStatus: string }>(
    `query GetPaymentStatus($orderId: ID!) {
      getPaymentStatus(orderId: $orderId)
    }`,
    { orderId },
  );
  return data.getPaymentStatus;
}
