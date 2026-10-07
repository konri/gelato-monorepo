/**
 * Live loyalty-point updates (GraphQL `pointsUpdated` subscription).
 * Screens subscribe so the Account balance can animate immediately, without
 * waiting for a push or a refetch round-trip.
 */

export type PointsLiveUpdate = {
  /**
   * Whose wallet changed (the socket's user). A socket that outlived its
   * session must never update the next user's screens (review #1).
   */
  userId?: string | null;
  /** The changed wallet's numbers (= brandAvailablePoints / brandTotalPoints). */
  availablePoints: number;
  totalPoints: number;
  change: number;
  /** Per-brand wallets (BRANDS_SPEC §5.2): which brand's wallet changed. */
  brandId?: string | null;
  brandName?: string | null;
  brandAvailablePoints?: number | null;
  brandTotalPoints?: number | null;
  /** LedgerSource: ORDER, STAFF_TEMPLATE, STAFF_CUSTOM, BIRTHDAY, REFERRAL_*, PRIZE_*, … */
  source?: string | null;
  spotId?: string | null;
  spotName?: string | null;
};

/**
 * True when a live update may be applied to `currentUserId`'s data: the
 * receiver knows who is logged in and the update names that same user.
 * Updates without a user, or before the user is known, are dropped (the next
 * refetch brings the numbers anyway).
 */
export const isLiveUpdateFor = (
  update: Pick<PointsLiveUpdate, 'userId'>,
  currentUserId: string | null | undefined,
): boolean => !!currentUserId && !!update.userId && update.userId === currentUserId;

type Listener = (update: PointsLiveUpdate) => void;

const listeners = new Set<Listener>();

export const onPointsUpdated = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitPointsUpdated = (update: PointsLiveUpdate): void => {
  listeners.forEach((l) => {
    try {
      l(update);
    } catch {
      /* ignore */
    }
  });
};
