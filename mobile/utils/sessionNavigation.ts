import { router } from 'expo-router';

/**
 * End-of-session navigation (logout, account delete, session expiry).
 *
 * `router.replace('/welcome')` alone only swaps the TOP screen: from Settings
 * the stack becomes [(tabs), welcome], so the tab layouts stay mounted under
 * /welcome with their own auth state, the points socket and the previous
 * user's card (Android back even shows it again). Popping the root stack to
 * its first screen first means the replace removes the tabs (review #1).
 */
export function leaveToWelcome(): void {
  try {
    if (router.canDismiss()) router.dismissAll();
  } catch {
    /* nothing to dismiss */
  }
  router.replace('/welcome');
}
