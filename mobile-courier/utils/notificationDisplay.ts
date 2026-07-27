import type { TFunction } from 'i18next';
import type { AppNotification } from '@repo/api-client';

// The backend stores notification title/body in English. We re-render them from
// `type` + `data` so the courier sees them in their chosen language. Falls back
// to the stored strings for unknown types.

export type LocalizedNotification = { title: string; body: string };

export function localizeNotification(
  t: TFunction,
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'data'>,
): LocalizedNotification {
  const data = n.data ?? {};
  const spot = (data.spotName as string | undefined) ?? '';
  const number = (data.orderNumber as string | undefined) ?? '';

  switch (n.type) {
    case 'COURIER_APPROVED':
      return {
        title: t('Notifications.approved.title'),
        body: t('Notifications.approved.body', { spot }),
      };
    case 'COURIER_REJECTED':
      return {
        title: t('Notifications.rejected.title'),
        body: t('Notifications.rejected.body', { spot }),
      };
    case 'DELIVERY_BROADCAST':
      return {
        title: t('Notifications.broadcast.title'),
        body: t('Notifications.broadcast.body', { number }),
      };
    default:
      // Unknown type — show whatever the server stored.
      return { title: n.title, body: n.body };
  }
}
