import { useToast } from '@/components/organisms/ToastProvider';
import NotificationService from '@/services/notificationService';
import { emitForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { routeFromPushData } from '@/utils/notificationRouting';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

/**
 * Bridges incoming push notifications to the app UI (spot app). Mounted under
 * <ToastProvider> so it can call useToast() and expo-router's `router`.
 *
 *   - Foreground push → toast + signal screens to refetch.
 *   - Background tap   → deep-link to the per-type target (or the notifications
 *                        list if the type has no target).
 *   - Cold start       → same deep-link, once.
 *
 * This is the ONLY place notification listeners are registered.
 */
export function NotificationBridge() {
  const toast = useToast();
  const handledColdStart = useRef(false);

  useEffect(() => {
    const navigate = (data: Record<string, string | undefined> | undefined) => {
      const target = routeFromPushData(data);
      router.push((target ?? '/notifications') as never);
    };

    const cleanup = NotificationService.setupNotificationListeners(
      (notification) => {
        const content = notification.request.content;
        const message = content.title || content.body || '';
        if (message) toast.show(message, 'info');
        refreshEmitter.emit();
        emitForegroundNotification(
          (content.data ?? {}) as Record<string, string | undefined>,
        );
      },
      (response) => {
        navigate(
          response.notification.request.content.data as Record<string, string | undefined>,
        );
      },
    );

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

    return cleanup;
  }, [toast]);

  return null;
}
