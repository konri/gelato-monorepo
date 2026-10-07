import type { LoginResponse } from '@/shared/api-client/src/api/types';
import { onCodeEvent } from '@/shared/api-client/src/codeEvents';
import { removeDeviceToken } from '@/shared/api-client/src/graphql/mutations/notifications/removeDevice';
import { getWhoAmI } from '@/shared/api-client/src/graphql/queries/user/getWhoAmI';
import { AUTH_KEYS, onSessionExpired } from '@/shared/api-client/src/session';
import { disposeRealtime } from '@/shared/realtime/wsClient';
import { spotStore } from '@/stores/spotStore';
import { getInstallId } from '@/utils/deviceId';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Platform } from 'react-native';

/**
 * The signed-in session (BRANDS_SPEC §4.1). One module-level store read with
 * useSyncExternalStore, so every screen sees login and logout at once. This
 * replaces the per-instance `useAuthState` (live bug C3: the root layout never
 * saw a login or a logout, so order alerts stayed off after login and polling
 * continued after logout). `useAuthState` remains as a thin wrapper.
 */

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

export type SessionUser = {
  id?: string;
  email?: string;
  name?: string | null;
  firstName?: string | null;
  surname?: string | null;
  roles?: string[];
  [key: string]: unknown;
};

export type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  userId: string | null;
  /** Access token as of load / sign-in (requests read the current one from storage). */
  token: string | null;
  /** i18n key of a notice for the login screen (e.g. a forced password change). */
  noticeKey: string | null;
};

const INITIAL: SessionState = { status: 'loading', user: null, userId: null, token: null, noticeKey: null };

// Keys from older client-era flows that also belong to a session.
const EXTRA_KEYS = ['pendingPhoneNumber', 'pendingVerificationEmail', 'pendingPasswordResetEmail'];

let state: SessionState = INITIAL;
const listeners = new Set<() => void>();
let loaded = false;
let signingOut: Promise<void> | null = null;

function setState(patch: Partial<SessionState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getState = () => state;

async function load(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const [isLoggedIn, userData, token] = await AsyncStorage.multiGet(['isLoggedIn', 'userData', 'access_token']);
    const signedIn = isLoggedIn[1] === 'true' && !!token[1];
    const user = userData[1] ? (JSON.parse(userData[1]) as SessionUser) : null;
    if (!signedIn) {
      spotStore.reset();
      setState({ status: 'signedOut', user: null, userId: null, token: null });
      return;
    }
    const userId = typeof user?.id === 'string' ? user.id : null;
    setState({ status: 'signedIn', user, userId, token: token[1] });
    await spotStore.hydrateFromCache(userId);
  } catch (error) {
    logger.error('Error loading the session:', error);
    spotStore.reset();
    setState({ status: 'signedOut', user: null, userId: null, token: null });
  }
}

/** Refreshes the cached profile (`userData`) from `me`; best effort. */
async function syncUserData(): Promise<void> {
  try {
    const result = await getWhoAmI();
    if (result.success && result.data) {
      const merged = { ...(state.user ?? {}), ...(result.data as unknown as SessionUser) };
      await AsyncStorage.multiSet([
        ['locationPermissionGranted', result.data.locationPermission ? 'true' : 'false'],
        ['userData', JSON.stringify(merged)],
      ]);
      if (state.status === 'signedIn') setState({ user: merged });
    }
  } catch (error) {
    logger.error('Error syncing user data:', error);
  }
}

/**
 * Explicit staff login: stores the tokens, seeds the spot context from the
 * login response (spots, levels, brand) and refreshes the profile.
 */
async function signIn(data: LoginResponse): Promise<void> {
  const user = data.user as unknown as SessionUser;
  const token = data.token.access_token;
  const entries: [string, string][] = [
    ['isLoggedIn', 'true'],
    ['userData', JSON.stringify(user)],
    ['access_token', token],
  ];
  if (data.refreshToken) entries.push(['refresh_token', data.refreshToken]);
  if (user.email && !String(user.email).includes('@phone.easybons')) entries.push(['userEmail', String(user.email)]);
  await AsyncStorage.multiSet(entries);
  await spotStore.hydrateFromLogin(data.user);
  setState({
    status: 'signedIn',
    user,
    userId: typeof user.id === 'string' ? user.id : null,
    token,
    noticeKey: null,
  });
  void syncUserData();
}

/** Legacy writer kept for `useAuthState().updateAuthState` (client-era flows). */
async function setAuth(user: SessionUser, token: string, refreshToken?: string): Promise<void> {
  const entries: [string, string][] = [
    ['isLoggedIn', 'true'],
    ['userData', JSON.stringify(user)],
    ['access_token', token],
  ];
  if (refreshToken) entries.push(['refresh_token', refreshToken]);
  if (user.email && !String(user.email).includes('@phone.easybons')) entries.push(['userEmail', String(user.email)]);
  await AsyncStorage.multiSet(entries);
  setState({ status: 'signedIn', user, userId: typeof user.id === 'string' ? user.id : null, token });
}

async function teardown(noticeKey: string | null): Promise<void> {
  disposeRealtime();
  try {
    await AsyncStorage.multiRemove([...AUTH_KEYS, ...EXTRA_KEYS]);
  } catch {
    /* ignore */
  }
  spotStore.reset();
  setState({ status: 'signedOut', user: null, userId: null, token: null, noticeKey });
  try {
    // Drop the previous user's screens first: a plain replace would leave
    // them under /login in the stack (reachable with back / swipe).
    if (router.canDismiss()) router.dismissAll();
    router.replace('/login');
  } catch {
    /* navigator not mounted yet: app/index.tsx routes to /login */
  }
}

/**
 * Sign-out hygiene (§4.1):
 * 1. deactivate this install's push token (shared tablets stop getting the
 *    previous user's pushes);
 * 2. close the realtime socket;
 * 3. remove the auth keys, `spotContext` and `staff.session.v2` (the per-user
 *    `staff.activeSpot.v2.<userId>` is kept);
 * 4. reset the spot context;
 * 5. clear the navigation stack and go to /login.
 */
function signOut(opts: { noticeKey?: string | null } = {}): Promise<void> {
  if (signingOut) return signingOut;
  signingOut = (async () => {
    try {
      if (Platform.OS !== 'web') {
        const token = await AsyncStorage.getItem('access_token');
        if (token) await removeDeviceToken(await getInstallId(), token);
      }
    } catch (e) {
      logger.warn('removeFCMToken on sign-out failed', e);
    }
    await teardown(opts.noticeKey ?? null);
  })().finally(() => {
    signingOut = null;
  });
  return signingOut;
}

/** The session died (refresh failed): same hygiene, minus the server call. */
function expire(): Promise<void> {
  if (signingOut) return signingOut;
  if (state.status === 'signedOut') return Promise.resolve();
  signingOut = teardown(null).finally(() => {
    signingOut = null;
  });
  return signingOut;
}

function clearNotice(): void {
  if (state.noticeKey) setState({ noticeKey: null });
}

export const session = { getState, subscribe, load, signIn, setAuth, signOut, expire, clearNotice, syncUserData };

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getState, getState);
}

const PASSWORD_NOTICE = 'Spot.passwordChangeRequired';

export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void session.load();
  }, []);

  useEffect(() => {
    // A request could not be authorized and the refresh failed.
    const offExpired = onSessionExpired(() => {
      void session.expire();
    });
    // The account must set a new password first (restricted session).
    const offCodes = onCodeEvent((event) => {
      if (event.code === 'PASSWORD_CHANGE_REQUIRED' && state.status === 'signedIn') {
        void session.signOut({ noticeKey: PASSWORD_NOTICE });
      }
    });
    const offNotices = spotStore.onNotice((notice) => {
      if (notice.kind === 'passwordChangeRequired' && state.status === 'signedIn') {
        void session.signOut({ noticeKey: PASSWORD_NOTICE });
      }
    });
    return () => {
      offExpired();
      offCodes();
      offNotices();
    };
  }, []);

  return <>{children}</>;
}
