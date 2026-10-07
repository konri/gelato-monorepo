import { router } from 'expo-router';
import { logger } from '@/utils/logger';

/**
 * Stack screens whose content belongs to ONE spot (BRANDS_SPEC §4.2). When the
 * active spot changes while one of them is open, we go back to the tabs so
 * nobody edits spot A's menu while the header says spot B.
 *
 * Not listed on purpose: `/order/*` (the server checks access on the order's
 * own spot), `/notifications`, `/notification/*`, `/settings/*`, `/login`,
 * `/choose-spot`.
 */
const SPOT_SCOPED_STACK_ROUTES: RegExp[] = [
  /^\/menu(\/|$)/,
  /^\/spot-details(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/complaints(\/|$)/,
  /^\/news(\/|$)/,
  /^\/news_comments\//,
  /^\/staff(\/|$)/,
  /^\/history(\/|$)/,
  /^\/canceled(\/|$)/,
  /^\/courier\//,
];

// expo-router has no imperative "current path" getter; SpotContextProvider
// mirrors usePathname() here.
let currentPathname = '/';

export function setCurrentPathname(pathname: string): void {
  currentPathname = pathname || '/';
}

export function getCurrentPathname(): string {
  return currentPathname;
}

export function isSpotScopedStackRoute(pathname: string): boolean {
  return SPOT_SCOPED_STACK_ROUTES.some((re) => re.test(pathname));
}

/** Leaves a spot-scoped stack screen for the tabs (no-op elsewhere). */
export function leaveSpotScopedScreens(): void {
  if (!isSpotScopedStackRoute(currentPathname)) return;
  try {
    router.dismissTo('/(tabs)');
  } catch (e) {
    logger.warn('leaveSpotScopedScreens: dismissTo failed, replacing', e);
    try {
      router.replace('/(tabs)');
    } catch {
      /* navigator not mounted yet */
    }
  }
}
