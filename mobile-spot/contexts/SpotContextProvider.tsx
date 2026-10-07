import { useToast } from '@/components/organisms/ToastProvider';
import { useSession } from '@/contexts/SessionProvider';
import { onCodeEvent } from '@/shared/api-client/src/codeEvents';
import { spotStore } from '@/stores/spotStore';
import { setCurrentPathname } from '@/utils/leaveSpotScopedScreens';
import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { useSpotState } from '@/hooks/useActiveSpot';

const FOREGROUND_STALE_MS = 2 * 60 * 1000;
const REFRESH_EVERY_MS = 10 * 60 * 1000;
const COUNTS_EVERY_MS = 30 * 1000;
const SCOPE_REFRESH_MIN_GAP_MS = 10 * 1000;

/**
 * Keeps the spot context (stores/spotStore.ts) fresh and turns its notices into
 * UI (BRANDS_SPEC §4.2):
 *   - myStaffContext on foreground (if older than 2 min), every 10 min and on
 *     SCOPE_FORBIDDEN (assignments may have changed);
 *   - myStaffSpots counters every 30 s while the user can switch;
 *   - the first open of a new day asks for the spot again;
 *   - "switched" / "lost access" toasts, with a haptic on a switch;
 *   - mirrors the current route for leaveSpotScopedScreens().
 * Screens read the store through hooks/useActiveSpot.ts.
 */
export function SpotContextProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const toast = useToast();
  const pathname = usePathname();
  const session = useSession();
  const spot = useSpotState();
  const signedIn = session.status === 'signedIn';
  const ready = spot.status === 'ready';
  const canSwitch = spot.spots.length > 1;

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  // Notices → toasts (+ a light haptic on a switch the user made).
  useEffect(
    () =>
      spotStore.onNotice((notice) => {
        if (notice.kind === 'switched') {
          toast.show(t('SpotSwitcher.switched', { name: notice.name }), 'success');
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        } else if (notice.kind === 'lostAccess') {
          toast.show(
            notice.name
              ? t('SpotSwitcher.lostAccess', { name: notice.name })
              : t('SpotSwitcher.lostAccessUnnamed'),
            'info',
          );
        }
      }),
    [t, toast],
  );

  // SCOPE_FORBIDDEN from any request: the assignments may have changed.
  const lastScopeRefresh = useRef(0);
  useEffect(
    () =>
      onCodeEvent((event) => {
        if (event.code !== 'SCOPE_FORBIDDEN') return;
        const now = Date.now();
        if (now - lastScopeRefresh.current < SCOPE_REFRESH_MIN_GAP_MS) return;
        lastScopeRefresh.current = now;
        void spotStore.refresh('scopeError');
      }),
    [],
  );

  // Foreground: revalidate when stale; a new day asks for the spot again.
  useEffect(() => {
    if (!signedIn) return;
    const onChange = (next: AppStateStatus) => {
      if (next !== 'active') return;
      spotStore.checkNewDay();
      const { fetchedAt } = spotStore.getState();
      if (!fetchedAt || Date.now() - fetchedAt > FOREGROUND_STALE_MS) {
        void spotStore.refresh('foreground');
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [signedIn]);

  // Every 10 minutes while the app is in the foreground.
  useEffect(() => {
    if (!signedIn) return;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') void spotStore.refresh('interval');
    }, REFRESH_EVERY_MS);
    return () => clearInterval(id);
  }, [signedIn]);

  // Switcher counters (waiting / you claimed) every 30 s when switchable.
  useEffect(() => {
    if (!signedIn || !ready || !canSwitch) return;
    void spotStore.refreshCounts();
    const id = setInterval(() => {
      if (AppState.currentState === 'active') void spotStore.refreshCounts();
    }, COUNTS_EVERY_MS);
    return () => clearInterval(id);
  }, [signedIn, ready, canSwitch]);

  return <>{children}</>;
}
