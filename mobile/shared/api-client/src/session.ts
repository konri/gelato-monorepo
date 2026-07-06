import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Central session-expiry signal. When an authed request fails and the token
 * cannot be refreshed, we clear the stored session and notify listeners (the
 * root layout) so the app can redirect to the login screen instead of looping
 * "Access denied".
 */

type Listener = () => void;
const listeners = new Set<Listener>();

// Guard so a burst of failing requests only triggers one logout.
let expiring = false;

const AUTH_KEYS = [
  'isLoggedIn',
  'userData',
  'access_token',
  'refresh_token',
  'userEmail',
  'isFirstTimeLogin',
];

export const onSessionExpired = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Clear the persisted session and notify listeners. Idempotent within a burst.
 */
export const handleSessionExpired = async (): Promise<void> => {
  if (expiring) return;
  expiring = true;
  try {
    await AsyncStorage.multiRemove(AUTH_KEYS);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore */
    }
  });
  // Allow a future login → expiry cycle.
  setTimeout(() => {
    expiring = false;
  }, 3000);
};
