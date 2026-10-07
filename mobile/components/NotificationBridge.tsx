import { useToast, type ToastAction } from '@/components/organisms/ToastProvider';
import NotificationService from '@/services/notificationService';
import { emitForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { onBrandGain, useBrandContext } from '@/hooks/useBrands';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { pointsText } from '@/utils/formatPoints';
import { noteDeepLink, routeFromPushData } from '@/utils/notificationRouting';
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
/**
 * One credit often arrives twice: as a push and on the socket. Within this
 * window the second copy adds nothing new, except the socket's "Show {brand}"
 * action, which is then attached to the toast already on screen.
 */
const POINTS_DUPLICATE_MS = 4000;

export function NotificationBridge() {
  const { show, attachAction } = useToast();
  const { t } = useTranslation();
  // Not useBrands(): the root must not load the overview by itself.
  const { selectBrand } = useBrandContext();
  const handledColdStart = useRef(false);
  const lastToastKey = useRef('');
  const lastToastAt = useRef(0);
  const lastPointsToastAt = useRef(0);

  useEffect(() => {
    const navigate = (data: Record<string, string | undefined> | undefined) => {
      noteDeepLink();
      const target = routeFromPushData(data);
      if (target) {
        // Home (My card) is a tab: navigate to it instead of stacking a copy.
        if (target.startsWith('/(tabs)')) router.navigate(target as never);
        else router.push(target as never);
      } else {
        // No specific target — open the notification center.
        router.push('/notification_center' as never);
      }
    };

    const toastFromPush = (
      title: string | undefined,
      body: string | undefined,
      data: Record<string, string | undefined>,
      action?: ToastAction,
    ) => {
      const kind = data.kind || data.type;
      const message =
        kind === 'POINTS_EARNED' ? body || title || '' : title || body || '';
      const now = Date.now();
      if (kind === 'POINTS_EARNED') {
        if (now - lastPointsToastAt.current < POINTS_DUPLICATE_MS) {
          // Same credit (push first, socket second): keep the visible toast
          // and give it the action instead of dropping the action (review #4).
          // If that toast is already gone, show this one with its action.
          if (action && !attachAction(action, { type: 'success' }) && message) {
            show(message, 'success', { action });
          }
          return;
        }
        lastPointsToastAt.current = now;
      }
      const key = `${kind || ''}|${message}`;
      const isDuplicate = key === lastToastKey.current && now - lastToastAt.current < 2000;
      lastToastKey.current = key;
      lastToastAt.current = now;
      if (!message || isDuplicate) return;
      show(message, kind === 'POINTS_EARNED' ? 'success' : 'info', { action });
    };

    const handleForeground = (
      title: string | undefined,
      body: string | undefined,
      data: Record<string, string | undefined>,
      action?: ToastAction,
    ) => {
      toastFromPush(title, body, data, action);
      refreshEmitter.emit();
      emitForegroundNotification(data);
    };

    const cleanupExpo = NotificationService.setupNotificationListeners(
      // Foreground: toast + let the focused screen refresh.
      (notification) => {
        const content = notification.request.content;
        handleForeground(
          content.title ?? undefined,
          content.body ?? undefined,
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

    // Live credits (WS, via the BrandProvider). Toast only when points were
    // added; it names the brand. When My card did not switch to that brand,
    // the toast offers "Show {brand}" (BRANDS_SPEC §5.2).
    const cleanupPoints = onBrandGain((gain) => {
      if (gain.change <= 0) return;
      const data = { kind: 'POINTS_EARNED', type: 'POINTS_EARNED' };
      if (!gain.brandName) {
        handleForeground(
          t('Notifications.pointsEarned.title'),
          t('Notifications.pointsEarned.body', {
            points: gain.change,
            totalPoints: gain.availablePoints,
          }),
          data,
        );
        return;
      }
      const brandId = gain.brandId;
      const action: ToastAction | undefined =
        brandId && !gain.isShown
          ? {
              label: t('Loyalty.gainShow', { brand: gain.brandName }),
              onPress: () => {
                selectBrand(brandId, 'user');
                router.navigate({
                  pathname: '/(tabs)',
                  params: { section: 'account', t: String(Date.now()) },
                } as never);
              },
            }
          : undefined;
      handleForeground(
        t('Notifications.pointsEarned.title'),
        t('Loyalty.gainToast', {
          brand: gain.brandName,
          pointsText: pointsText(t, gain.change),
          totalText: pointsText(t, gain.availablePoints),
        }),
        data,
        action,
      );
    });

    return () => {
      cleanupExpo();
      cleanupFcm();
      cleanupPoints();
    };
  }, [show, attachAction, t, selectBrand]);

  return null;
}
