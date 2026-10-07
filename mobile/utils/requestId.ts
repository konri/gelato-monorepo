/**
 * Idempotency key for mutations that must not run twice (redeemPrize,
 * BRANDS_SPEC §5.2). Hermes has no `crypto.randomUUID`, and the server only
 * needs a unique string per user action: create one when the user opens the
 * confirm step and REUSE it for every retry of that action.
 */
export const newRequestId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
