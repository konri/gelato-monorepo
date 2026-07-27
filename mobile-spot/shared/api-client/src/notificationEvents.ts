/**
 * Central foreground-notification signal. When a push arrives while the app is
 * in the foreground, the NotificationBridge emits the (string-valued) FCM data
 * payload here so interested screens can refetch their GraphQL query. Decoupled
 * from React like errorEvents.ts.
 */

export type ForegroundNotification = Record<string, string | undefined>;
type Listener = (payload: ForegroundNotification) => void;

const listeners = new Set<Listener>();

export const onForegroundNotification = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitForegroundNotification = (payload: ForegroundNotification): void => {
  listeners.forEach((l) => {
    try {
      l(payload);
    } catch {
      /* ignore */
    }
  });
};
