import type { TFunction } from 'i18next';
import type { AppNotification } from '@repo/api-client';

// The backend stores notification title/body in English. We re-render them from
// `type` + `data` so the client sees them in their chosen language. Falls back
// to the stored strings for unknown types.

export type LocalizedNotification = { title: string; body: string };

export function localizeNotification(
  t: TFunction,
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'data'>,
): LocalizedNotification {
  const data = n.data ?? {};

  if (n.type === 'order') {
    const number = (data.orderNumber as string | undefined) ?? '';
    const status = (data.status as string | undefined) ?? '';
    const key =
      status === 'PREPARING'
        ? 'preparing'
        : status === 'READY'
          ? 'ready'
          : status === 'DELIVERED'
            ? 'delivered'
            : status === 'COLLECTED'
              ? 'collected'
              : status === 'CANCELLED'
                ? 'cancelled'
                : 'generic';
    return {
      title: t(`Notifications.order.${key}.title`),
      body: t(`Notifications.order.${key}.body`, { number }),
    };
  }

  if (n.type === 'NEWS') {
    // The news headline is stored as the notification body.
    return {
      title: t('Notifications.news.title'),
      body: n.body,
    };
  }

  // Unknown type — show whatever the server stored.
  return { title: n.title, body: n.body };
}
