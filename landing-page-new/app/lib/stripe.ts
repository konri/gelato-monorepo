import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { publicConfig } from "./public-config";

const KEY = publicConfig.stripePublishableKey;

export const stripeConfigured = Boolean(KEY);

// Single Stripe.js instance for the whole app (loadStripe memoizes internally,
// but we guard so a missing key doesn't throw at import time).
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!KEY) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(KEY);
  return stripePromise;
}
