import type { TFunction } from 'i18next';
import type { AppNotification } from '@repo/api-client';
import { pointsText } from '@/utils/formatPoints';

// The backend stores notification title/body in English. We re-render them from
// `type` + `data` so the client sees them in their chosen language. Falls back
// to the stored strings for unknown types.

export type LocalizedNotification = { title: string; body: string };

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

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
      const brand = str(data.brandName);
      return {
        title: t('Notifications.order.terminated.title'),
        body: t('Notifications.order.terminated.body', {
          number,
          reason: reason ? t('Notifications.order.terminated.reason', { reason }) : '',
          apology:
            points > 0
              ? brand
                ? t('Notifications.order.terminated.apologyBrand', { brand, pointsText: pointsText(t, points) })
                : t('Notifications.order.terminated.apology', { pointsText: pointsText(t, points) })
              : '',
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

  // Loyalty events (backend loyaltyNotifications.ts): always name the brand (A4).
  const brand = str(data.brandName);
  const points = num(data.points);
  const total = num(data.totalPoints);
  const reward = str(data.prizeName);

  if (n.type === 'POINTS_EARNED') {
    if (brand && points != null) {
      return {
        title: t('Notifications.pointsEarned.titleBrand', { brand, pointsText: pointsText(t, points) }),
        body: t('Notifications.pointsEarned.bodyBrand', {
          brand,
          pointsText: pointsText(t, points),
          totalText: pointsText(t, total ?? 0),
        }),
      };
    }
    return {
      title: t('Notifications.pointsEarned.title'),
      body: t('Notifications.pointsEarned.body', {
        points: String(data.points ?? ''),
        totalPoints: String(data.totalPoints ?? ''),
      }),
    };
  }

  if (!brand) return { title: n.title, body: n.body };

  const vars = {
    brand,
    reward,
    pointsText: pointsText(t, points ?? 0),
    totalText: pointsText(t, total ?? 0),
  };
  switch (n.type) {
    case 'BIRTHDAY_BONUS':
      return { title: t('Notifications.birthdayBonus.title'), body: t('Notifications.birthdayBonus.body', vars) };
    case 'REFERRAL_BONUS':
      return { title: t('Notifications.referralBonus.title'), body: t('Notifications.referralBonus.body', vars) };
    case 'REWARD_REFUNDED':
      return {
        title: t('Notifications.rewardRefunded.title'),
        body: reward
          ? t('Notifications.rewardRefunded.body', vars)
          : t('Notifications.rewardRefunded.bodyNoReward', vars),
      };
    case 'REWARD_EXPIRING':
      return {
        title: t('Notifications.rewardExpiring.title'),
        body: reward
          ? t('Notifications.rewardExpiring.body', vars)
          : t('Notifications.rewardExpiring.bodyNoReward', vars),
      };
    case 'REWARD_EXCHANGED':
      return {
        title: t('Notifications.rewardExchanged.title'),
        body: reward
          ? t('Notifications.rewardExchanged.body', vars)
          : t('Notifications.rewardExchanged.bodyNoReward', vars),
      };
    default:
      // Unknown type — show whatever the server stored.
      return { title: n.title, body: n.body };
  }
}
