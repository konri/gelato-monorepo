/**
 * Maps a notification to the in-app route it should open (courier app).
 *
 * FCM push payloads carry all-string values; the discriminator is `kind`
 * (preferred) or `type`. Persisted bell rows carry the stored `type` string
 * and real JSON `data`.
 *
 * The courier app has a single active-delivery screen (`/delivery`, no id
 * param — it reads myActiveDelivery). Delivery broadcasts / order-ready pushes
 * route there. Approval/rejection notifications have no target screen, so they
 * fall back to the generic /notification/[id] detail (return null).
 */

type StringMap = Record<string, string | undefined>;

// Route straight from an FCM push data payload (all strings).
export function routeFromPushData(data: StringMap | undefined): string | null {
  if (!data) return null;
  const kind = data.kind || data.type || '';

  // Delivery broadcast, order-ready, an order-chat message, or any ORDER_* push
  // all point at the courier's single active-delivery screen.
  if (
    kind === 'DELIVERY_BROADCAST' ||
    kind === 'ORDER_READY' ||
    kind === 'ORDER_MESSAGE' ||
    kind.startsWith('ORDER')
  ) {
    return '/delivery';
  }
  return null;
}

// Route from a persisted bell row (`type` + JSON `data`).
export function routeFromNotification(
  type: string,
  _data: { [k: string]: unknown } | null | undefined,
): string | null {
  if (type === 'DELIVERY_BROADCAST' || type === 'order_message') {
    return '/delivery';
  }
  return null;
}
