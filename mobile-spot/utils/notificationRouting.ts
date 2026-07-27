/**
 * Maps a notification to the in-app route it should open (spot app).
 *
 * FCM push payloads carry all-string values; the discriminator is `kind`
 * (preferred) or `type`. Persisted bell rows carry the stored `type` string
 * (e.g. 'order', 'DELIVERY_INCIDENT') and real JSON `data`.
 *
 * Unknown types return null → callers fall back to /notification/[id].
 */

type StringMap = Record<string, string | undefined>;

// Route straight from an FCM push data payload (all strings).
export function routeFromPushData(data: StringMap | undefined): string | null {
  if (!data) return null;
  const kind = data.kind || data.type || '';

  // Order chat message → open the order scrolled to that message.
  if (kind === 'ORDER_MESSAGE') {
    if (!data.orderId) return null;
    return data.messageId ? `/order/${data.orderId}?messageId=${data.messageId}` : `/order/${data.orderId}`;
  }
  // Delivery incident + any order push → the order detail.
  if (kind === 'DELIVERY_INCIDENT' || kind.startsWith('ORDER')) {
    return data.orderId ? `/order/${data.orderId}` : null;
  }
  return null;
}

// Route from a persisted bell row (`type` + JSON `data`).
export function routeFromNotification(
  type: string,
  data: { orderId?: string; messageId?: string; [k: string]: unknown } | null | undefined,
): string | null {
  if (type === 'order_message') {
    if (!data?.orderId) return null;
    return data.messageId ? `/order/${data.orderId}?messageId=${data.messageId}` : `/order/${data.orderId}`;
  }
  if (type === 'order' || type === 'DELIVERY_INCIDENT') {
    return data?.orderId ? `/order/${data.orderId}` : null;
  }
  return null;
}
