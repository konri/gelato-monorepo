import { useToast } from '@/components/organisms/ToastProvider';
import NotificationService from '@/services/notificationService';
import { emitForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { onPointsUpdated } from '@/shared/api-client/src/pointsEvents';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { routeFromPushData } from '@/utils/notificationRouting';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Bridges incoming push notifications to the app UI. Mounted under
 * <ToastProvider> so it can call useToast() and expo-router's `router`.
 *
 *   - Foreground push  → show a toast + signal screens to refetch.
 *   - Background tap    → deep-link to the per-type target (or the generic
 *                         notification detail if the type has no target).
 *   - Cold start (app killed → tapped) → same deep-link, once.
 *
 * NOTE: this is the ONLY place notification listeners are registered.
 * useNotificationRegistration handles token registration only.
 */
export function NotificationBridge() {
  const { show } = useToast();
  const { t } = useTranslation();
  const handledColdStart = useRef(false);
  const lastToastKey = useRef('');
  const lastToastAt = useRef(0);
  const lastPointsToastAt = useRef(0);

  useEffect(() => {
    const navigate = (data: Record<string, string | undefined> | undefined) => {
      const target = routeFromPushData(data);
      if (target) {
        router.push(target as never);
      } else {
        // No specific target — open the notification center.
        router.push('/notification_center' as never);
      }
    };

    const toastFromPush = (title: string | undefined, body: string | undefined, data: Record<string, string | undefined>) => {
      const kind = data.kind || data.type;
      const message =
        kind === 'POINTS_EARNED' ? body || title || '' : title || body || '';
      const now = Date.now();
      if (kind === 'POINTS_EARNED') {
        if (now - lastPointsToastAt.current < 4000) return;
        lastPointsToastAt.current = now;
      }
      const key = `${kind || ''}|${message}`;
      const isDuplicate = key === lastToastKey.current && now - lastToastAt.current < 2000;
      lastToastKey.current = key;
      lastToastAt.current = now;
      if (!message || isDuplicate) return;
      show(message, kind === 'POINTS_EARNED' ? 'success' : 'info');
    };

    const handleForeground = (title: string | undefined, body: string | undefined, data: Record<string, string | undefined>) => {
      toastFromPush(title, body, data);
      refreshEmitter.emit();
      emitForegroundNotification(data);
    };

    const cleanupExpo = NotificationService.setupNotificationListeners(
      // Foreground: toast + let the focused screen refresh.
      (notification) => {
        const content = notification.request.content;
        handleForeground(
          content.title,
          content.body,
          (content.data ?? {}) as Record<string, string | undefined>,
        );
      },
      // Tap (app in background): deep-link.
      (response) => {
        navigate(
          response.notification.request.content.data as Record<string, string | undefined>,
        );
      },
    );

    // FCM while the app is open never reaches expo-notifications — listen here
    // or POINTS_EARNED (and other) pushes stay silent and the balance stays stale.
    const cleanupFcm = NotificationService.setupFcmListeners(
      ({ title, body, data }) => handleForeground(title, body, data),
      (data) => navigate(data),
    );

    // Cold start: app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && !handledColdStart.current) {
          handledColdStart.current = true;
          navigate(
            response.notification.request.content.data as Record<string, string | undefined>,
          );
        }
      })
      .catch((e) => logger.warn('getLastNotificationResponseAsync failed', e));

    NotificationService.getInitialFcmData()
      .then((data) => {
        if (data && !handledColdStart.current) {
          handledColdStart.current = true;
          navigate(data);
        }
      })
      .catch((e) => logger.warn('getInitialFcmData failed', e));

    const cleanupPoints = onPointsUpdated((update) => {
      if (update.change <= 0) return;
      handleForeground(
        t('Notifications.pointsEarned.title'),
        t('Notifications.pointsEarned.body', {
          points: update.change,
          totalPoints: update.availablePoints,
        }),
        { kind: 'POINTS_EARNED', type: 'POINTS_EARNED' },
      );
    });

    return () => {
      cleanupExpo();
      cleanupFcm();
      cleanupPoints();
    };
  }, [show, t]);

  return null;
}
