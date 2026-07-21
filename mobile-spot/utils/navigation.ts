import { router } from 'expo-router';

/**
 * Go back, or fall back to a route when there's no history to pop.
 *
 * On web, deep-linking or refreshing a screen leaves the navigation stack with
 * no previous entry, so `router.back()` is a no-op and the back button appears
 * broken. This falls back to the given route (default: the Orders home) so the
 * user is never stranded.
 */
export const goBackOr = (fallback: string = '/(tabs)') => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
};
