/**
 * Browser-side token storage for the web client.
 *
 * The mobile app keeps tokens in AsyncStorage; on web we use localStorage.
 * Keys are namespaced so they don't collide with other app state.
 */

const ACCESS_KEY = "gelato_access_token";
const REFRESH_KEY = "gelato_refresh_token";

const isBrowser = () => typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string | null): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}
