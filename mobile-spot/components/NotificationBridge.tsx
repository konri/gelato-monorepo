import { useToast } from '@/components/organisms/ToastProvider';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import NotificationService from '@/services/notificationService';
import { emitForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { spotStore } from '@/stores/spotStore';
import { logger } from '@/utils/logger';
import { routeFromPushData } from '@/utils/notificationRouting';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import i18n from 'i18next';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

type PushData = Record<string, string | undefined>;

/** Yes / no question that works on web too (Alert has no buttons there). */
function confirmSwitch(spotName: string, currentName: string): Promise<boolean> {
  const title = i18n.t('SpotNotif.switchTitle', { spot: spotName });
  const message = i18n.t('SpotNotif.switchBody', { spot: spotName, current: currentName });
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(`${title}\n\n${message}`)
      : false;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: i18n.t('SpotNotif.switchCancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: i18n.t('SpotNotif.switchConfirm'), onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * Opens what a push points at, without ever switching the spot on its own
 * (BRANDS_SPEC §4.6):
 * 1. wait until a spot is active (cold start; stops if the session ends);
 * 2. an order route opens directly: the order screen is not spot-scoped, the
 *    server checks access on the order's own spot, and the screen offers
 *    "Switch to this spot" when the order is from another spot;
 * 3. anything else at another accessible spot asks "Switch to {spot}?" first;
 * 4. a spot the user can no longer access → the notification list.
 */
export async function openPush(data: PushData | undefined): Promise<void> {
  if (!(await spotStore.whenReady())) return;
  const target = routeFromPushData(data);
  if (target) {
    router.push(target as never);
    return;
  }
  const spotId = data?.spotId;
  const activeSpotId = spotStore.getActiveSpotId();
  if (spotId && spotId !== activeSpotId) {
    const spot = spotStore.getSpot(spotId);
    if (!spot) {
      router.push('/notifications');
      return;
    }
    const current = spotStore.getActiveSpot();
    const yes = await confirmSwitch(data?.spotName || spot.name, current?.name ?? '');
    if (!yes) return;
    await spotStore.setActiveSpot(spotId, 'user');
  }
  router.push('/notifications');
}

/**
 * Bridges incoming push notifications to the app UI (spot app). Mounted under
 * <ToastProvider> so it can call useToast() and expo-router's `router`.
 *
 *   - Foreground push → toast + signal screens to refetch. A new order at
 *     another of the user's spots becomes a tappable toast (the alert modal
 *     only covers the active spot); other pushes for another spot are
 *     prefixed with that spot's name.
 *   - Background tap   → openPush (above).
 *   - Cold start       → same, once, after the spot context is ready.
 *
 * This is the ONLY place notification listeners are registered.
 */
export function NotificationBridge() {
  const toast = useToast();
  const { t } = useTranslation();
  const handledColdStart = useRef(false);

  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners(
      (notification) => {
        const content = notification.request.content;
        const data = (content.data ?? {}) as PushData;
        const kind = data.kind || data.type || '';
        const activeSpotId = spotStore.getActiveSpotId();
        const otherSpot = !!data.spotId && !!activeSpotId && data.spotId !== activeSpotId;
        const spotName = data.spotName || spotStore.getSpot(data.spotId)?.name || '';

        if (kind === 'SPOT_NEW_ORDER') {
          // The active spot's new orders drive the claim modal (no toast).
          if (otherSpot && spotStore.isAccessible(data.spotId)) {
            toast.show(t('SpotNotif.newOrderOtherSpot', { spot: spotName }), 'info', {
              onPress: () => void openPush(data),
            });
          }
        } else {
          const text = content.title || content.body || '';
          // Name the spot when the push is about another one (the server
          // already prefixes its fallback pushes; don't repeat it).
          const prefixed =
            otherSpot && spotName && !text.startsWith(spotName) ? `${spotName}: ${text}` : text;
          if (prefixed) toast.show(prefixed, 'info', { onPress: () => void openPush(data) });
        }
        refreshEmitter.emit();
        emitForegroundNotification(data);
      },
      (response) => {
        void openPush(response.notification.request.content.data as PushData);
      },
    );

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && !handledColdStart.current) {
          handledColdStart.current = true;
          void openPush(response.notification.request.content.data as PushData);
        }
      })
      .catch((e) => logger.warn('getLastNotificationResponseAsync failed', e));

    return cleanup;
  }, [toast, t]);

  return null;
}
