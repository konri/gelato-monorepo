/**
 * Maps a notification to the in-app route it should open.
 *
 * Two sources feed this:
 *   - An FCM push payload (`response.notification.request.content.data`) — every
 *     value is a STRING, and the discriminator is `kind` (preferred) or `type`
 *     (the FCMService enum, e.g. ORDER_READY / NEWS_PUBLISHED).
 *   - A persisted bell row from GraphQL — `type` is the stored string
 *     (e.g. 'order', 'NEWS') and `data` is real JSON.
 *
 * Unknown/unhandled types return null; callers fall back to the generic
 * /notification/[id] detail screen, which always renders title/body/image.
 */

type StringMap = Record<string, string | undefined>;

// Route straight from an FCM push data payload (all strings).
export function routeFromPushData(data: StringMap | undefined): string | null {
  if (!data) return null;
  const kind = data.kind || data.type || '';

  if (kind === 'NEWS_PUBLISHED') {
    return data.newsId ? `/news_comments/${data.newsId}` : null;
  }
  // An order chat message — open the order scrolled to that message.
  if (kind === 'ORDER_MESSAGE') {
    if (!data.orderId) return null;
    return data.messageId
      ? `/order/track/${data.orderId}?messageId=${data.messageId}`
      : `/order/track/${data.orderId}`;
  }
  // Order status / terminated / any ORDER_* push.
  if (kind === 'ORDER_STATUS' || kind === 'TERMINATED' || kind.startsWith('ORDER')) {
    return data.orderId ? `/order/track/${data.orderId}` : null;
  }
  return null;
}

// Route from a persisted bell row (`type` + JSON `data`).
export function routeFromNotification(
  type: string,
  data: { orderId?: string; newsId?: string; messageId?: string; [k: string]: unknown } | null | undefined,
): string | null {
  if (type === 'NEWS') {
    return data?.newsId ? `/news_comments/${data.newsId}` : null;
  }
  if (type === 'order_message') {
    if (!data?.orderId) return null;
    return data.messageId
      ? `/order/track/${data.orderId}?messageId=${data.messageId}`
      : `/order/track/${data.orderId}`;
  }
  if (type === 'order') {
    return data?.orderId ? `/order/track/${data.orderId}` : null;
  }
  return null;
}
