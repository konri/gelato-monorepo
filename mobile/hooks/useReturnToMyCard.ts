import { useBrandContext } from '@/hooks/useBrands';
import { isOverlayOpen } from '@/hooks/useOverlayOpen';
import { msSinceDeepLink, myCardRoute } from '@/utils/notificationRouting';
import { router, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Away at least this long → the app comes back on My card. */
export const RETURN_TO_CARD_AFTER_MS = 5 * 60 * 1000;
/** Let a notification tap that opened the app navigate first. */
const SETTLE_MS = 800;
const DEEP_LINK_GRACE_MS = 3000;

/**
 * Re-opening the app after a break lands on My card, like a cold start
 * (BRANDS_SPEC §5.4, review #5): customers open the app at the counter to show
 * the card. Only from a tab's main screen with nothing open on top of it:
 * a pushed screen (an order, a reward, settings, sign-in…), a sheet, a dialog,
 * the brand picker or the fullscreen card keeps the user where they were.
 * Mounted once, by the Home tab (it lives as long as the tabs).
 */
export function useReturnToMyCardOnResume(): void {
  const segments = useSegments();
  const segmentsRef = useRef<string[]>(segments);
  segmentsRef.current = segments;
  const { isCardFocused, isPickerOpen } = useBrandContext();

  useEffect(() => {
    let backgroundAt: number | null = AppState.currentState === 'background' ? Date.now() : null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundAt = Date.now();
        return;
      }
      if (next !== 'active' || backgroundAt == null) return;
      const away = Date.now() - backgroundAt;
      backgroundAt = null;
      if (away < RETURN_TO_CARD_AFTER_MS) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (AppState.currentState !== 'active') return;
        if (msSinceDeepLink() < DEEP_LINK_GRACE_MS) return;
        const segs = segmentsRef.current;
        // A tab's own screen: "(tabs)" or "(tabs)/prizes"; anything deeper or
        // outside the tabs is a flow the user is in the middle of.
        const onTabScreen = segs[0] === '(tabs)' && segs.length <= 2;
        if (!onTabScreen) return;
        if (isOverlayOpen() || isPickerOpen() || isCardFocused()) return;
        router.navigate(myCardRoute() as never);
      }, SETTLE_MS);
    });

    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [isCardFocused, isPickerOpen]);
}
