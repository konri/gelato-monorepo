/**
 * Live loyalty-point updates (GraphQL `pointsUpdated` subscription).
 * Screens subscribe so the Account balance can animate immediately, without
 * waiting for a push or a refetch round-trip.
 */

export type PointsLiveUpdate = {
  availablePoints: number;
  totalPoints: number;
  change: number;
};

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
