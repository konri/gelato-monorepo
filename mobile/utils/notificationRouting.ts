/**
 * Maps a notification to the in-app route it should open.
 *
 * Two sources feed this:
 *   - An FCM push payload (`response.notification.request.content.data`) — every
 *     value is a STRING. Loyalty pushes carry `kind = 'POINTS_EARNED'` for every
 *     balance-changing event (so older code refreshes the wallet) and the real
 *     kind in `event` (BIRTHDAY_BONUS, REWARD_EXPIRING, …), plus `brandId` and
 *     `userPrizeId`. Other pushes use `kind` or `type` (FCMService enum).
 *   - A persisted bell row from GraphQL — `type` is the stored string
 *     (e.g. 'order', 'NEWS', 'POINTS_EARNED') and `data` is real JSON.
 *
 * Unknown/unhandled types return null; callers fall back to the generic
 * /notification/[id] detail screen, which always renders title/body/image.
 */

type StringMap = Record<string, string | undefined>;

/** Loyalty events that open My card on the event's brand (BRANDS_SPEC §5.6). */
export const CARD_EVENTS = new Set([
  'POINTS_EARNED',
  'BIRTHDAY_BONUS',
  'REFERRAL_BONUS',
  'REWARD_REFUNDED',
  // A3 counter exchange: the balance of that brand changed.
  'REWARD_EXCHANGED',
]);

/** Every loyalty notification kind of the backend (loyaltyNotifications.ts). */
export const LOYALTY_EVENTS = new Set([...CARD_EVENTS, 'REWARD_EXPIRING']);

/**
 * My card with that brand selected. `t` makes each tap a new navigation, so
 * the Home tabs remount on My card and the selection is applied once.
 */
export const myCardRoute = (brandId?: string | null): string => {
  const params = [`section=account`, brandId ? `brandId=${encodeURIComponent(brandId)}` : null, `t=${Date.now()}`]
    .filter(Boolean)
    .join('&');
  return `/(tabs)?${params}`;
};

// When a notification tap last navigated (epoch ms). The "back to My card
// after a long break" rule must not undo the tap that opened the app.
let lastDeepLinkAt = 0;
export const noteDeepLink = (): void => {
  lastDeepLinkAt = Date.now();
};
export const msSinceDeepLink = (): number => Date.now() - lastDeepLinkAt;

const loyaltyRoute = (event: string, brandId?: string | null, userPrizeId?: string | null): string | null => {
  if (event === 'REWARD_EXPIRING') {
    return userPrizeId ? `/prize/mine/${encodeURIComponent(userPrizeId)}` : '/prizes';
  }
  if (CARD_EVENTS.has(event)) return myCardRoute(brandId);
  return null;
};

// Route straight from an FCM push data payload (all strings).
export function routeFromPushData(data: StringMap | undefined): string | null {
  if (!data) return null;
  const kind = data.kind || data.type || '';
  const event = data.event || kind;

  if (LOYALTY_EVENTS.has(event)) {
    return loyaltyRoute(event, data.brandId, data.userPrizeId);
  }
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
  if (LOYALTY_EVENTS.has(type)) {
    const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
    return loyaltyRoute(type, str(data?.brandId), str(data?.userPrizeId));
  }
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
