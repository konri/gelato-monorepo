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
    if (data.terminated || status === 'TERMINATED') {
      const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
      const points = Number(data.apologyPoints ?? 0);
      return {
        title: t('Notifications.order.terminated.title'),
        body: t('Notifications.order.terminated.body', {
          number,
          reason: reason ? t('Notifications.order.terminated.reason', { reason }) : '',
          apology: points > 0 ? t('Notifications.order.terminated.apology', { points }) : '',
        }),
      };
    }
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

  if (n.type === 'POINTS_EARNED') {
    const points = String(data.points ?? '');
    const totalPoints = String(data.totalPoints ?? '');
    return {
      title: t('Notifications.pointsEarned.title'),
      body: t('Notifications.pointsEarned.body', { points, totalPoints }),
    };
  }

  // Unknown type — show whatever the server stored.
  return { title: n.title, body: n.body };
}
