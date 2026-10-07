import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  SESSION_VERSION,
  SESSION_VERSION_KEY,
} from '../lib/config';
import {
  adminChangePassword,
  adminLogin,
  type AdminUser,
  type AuthActionResult,
  type LoginBrand,
  type LoginResult,
} from '../lib/authApi';
import { apolloClient } from '../lib/apollo';
import { errorCode } from '../lib/errors';
import { onSessionEvent } from '../lib/sessionEvents';
import { ME, MY_STAFF_CONTEXT, type MeUser, type StaffContext } from '../graphql/staff';
import { scopeFromUser, type Scope } from './scope';

/** How the last session ended (drives the notice on /login). */
export type LogoutReason = 'expired' | 'no_membership' | 'manual';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthState = {
  user: AdminUser | null;
  /** 'loading' only while an older console's session is being revalidated. */
  status: SessionStatus;
  scope: Scope;
  brand: LoginBrand | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isBrandAdmin: boolean;
  mustChangePassword: boolean;
  /** The account became a spot admin / employee: the console is closed to it. */
  blocked: boolean;
  /** The backend asked for a newer console (UPGRADE_REQUIRED). */
  upgradeRequired: boolean;
  logoutReason: LogoutReason | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: (reason?: LogoutReason) => void;
  /** Changes the password, then signs in again with it (the old token stops working). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<LoginResult | AuthActionResult>;
  /** Re-reads myStaffContext now. */
  revalidate: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

/** myStaffContext is re-read on focus at most this often. */
const REVALIDATE_EVERY_MS = 60_000;

function readStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AdminUser;
    return user && typeof user === 'object' && typeof user.id === 'string' ? user : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(SESSION_VERSION_KEY);
}

function persistUser(user: AdminUser) {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_VERSION_KEY, SESSION_VERSION);
}

type Initial = { user: AdminUser | null; status: SessionStatus };

function initialSession(): Initial {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    clearStoredSession();
    return { user: null, status: 'anonymous' };
  }
  const user = readStoredUser();
  const current = localStorage.getItem(SESSION_VERSION_KEY) === SESSION_VERSION;
  // A session stored by an older console: spinner until myStaffContext answers.
  if (!user || !current) return { user: null, status: 'loading' };
  return { user, status: 'authenticated' };
}

function brandFromContext(ctx: StaffContext): LoginBrand | null {
  if (!ctx.brand) return null;
  return {
    id: ctx.brand.id,
    name: ctx.brand.name,
    logoUrl: ctx.brand.logoUrl ?? null,
    isActive: ctx.brand.isActive,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(initialSession);
  const [user, setUser] = useState<AdminUser | null>(initial.user);
  const [status, setStatus] = useState<SessionStatus>(initial.status);
  const [blocked, setBlocked] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null);
  const lastCheckedAt = useRef(0);
  const userRef = useRef<AdminUser | null>(initial.user);

  const commitUser = useCallback((next: AdminUser | null) => {
    userRef.current = next;
    setUser(next);
    if (next) persistUser(next);
  }, []);

  const logout = useCallback((reason: LogoutReason = 'manual') => {
    clearStoredSession();
    userRef.current = null;
    setUser(null);
    setStatus('anonymous');
    setBlocked(false);
    setLogoutReason(reason);
    void apolloClient.clearStore();
  }, []);

  /** Applies a fresh myStaffContext to the session. */
  const applyContext = useCallback(
    (ctx: StaffContext, base: AdminUser) => {
      if (ctx.scope === 'NONE') {
        logout('no_membership');
        return;
      }
      const brand = brandFromContext(ctx);
      const next: AdminUser = {
        ...base,
        staffKind: ctx.scope,
        brand,
        mustChangePassword: ctx.mustChangePassword,
      };
      // Moved to SPOT_ADMIN / EMPLOYEE: the console closes (UseSpotAppPage).
      setBlocked(ctx.scope === 'SPOT_ADMIN' || ctx.scope === 'EMPLOYEE');
      // Moved to another brand: nothing cached for the old one may be shown.
      if ((base.brand?.id ?? null) !== (brand?.id ?? null) && base.staffKind !== 'PLATFORM') {
        void apolloClient.resetStore();
      }
      commitUser(next);
    },
    [commitUser, logout],
  );

  const revalidate = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    lastCheckedAt.current = Date.now();
    try {
      const { data } = await apolloClient.query<{ myStaffContext: StaffContext }>({
        query: MY_STAFF_CONTEXT,
        fetchPolicy: 'network-only',
      });
      if (data && userRef.current) applyContext(data.myStaffContext, userRef.current);
    } catch (err) {
      // UNAUTHENTICATED is handled by the ErrorLink (logout); anything else
      // (offline, server hiccup) keeps the session as it is.
      if (errorCode(err) === 'UNAUTHENTICATED') logout('expired');
    }
  }, [applyContext, logout]);

  // Older console session: rebuild the user from me + myStaffContext.
  useEffect(() => {
    if (initial.status !== 'loading') return;
    let cancelled = false;
    (async () => {
      try {
        const [me, ctx] = await Promise.all([
          apolloClient.query<{ me: MeUser }>({ query: ME, fetchPolicy: 'network-only' }),
          apolloClient.query<{ myStaffContext: StaffContext }>({
            query: MY_STAFF_CONTEXT,
            fetchPolicy: 'network-only',
          }),
        ]);
        if (cancelled) return;
        if (!me.data || !ctx.data) throw new Error('empty');
        const base: AdminUser = {
          id: me.data.me.id,
          email: me.data.me.email,
          name: me.data.me.name ?? null,
          roles: me.data.me.roles,
          language: me.data.me.language ?? null,
          staffKind: 'PLATFORM',
          mustChangePassword: false,
          brand: null,
          spots: [],
        };
        userRef.current = base;
        lastCheckedAt.current = Date.now();
        applyContext(ctx.data.myStaffContext, base);
        if (userRef.current) setStatus('authenticated');
      } catch (err) {
        if (cancelled) return;
        logout(errorCode(err) === 'UNAUTHENTICATED' ? 'expired' : 'manual');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial.status, applyContext, logout]);

  // Revalidate a stored session once on start, then on focus (≥ 60 s apart).
  useEffect(() => {
    if (status !== 'authenticated') return;
    const maybeRevalidate = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastCheckedAt.current < REVALIDATE_EVERY_MS) return;
      void revalidate();
    };
    const timer = window.setTimeout(maybeRevalidate, 0);
    window.addEventListener('focus', maybeRevalidate);
    document.addEventListener('visibilitychange', maybeRevalidate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', maybeRevalidate);
      document.removeEventListener('visibilitychange', maybeRevalidate);
    };
  }, [status, revalidate]);

  // Signals from the ErrorLink and the REST helpers.
  useEffect(
    () =>
      onSessionEvent((event) => {
        if (event === 'unauthenticated') {
          if (userRef.current) logout('expired');
        } else if (event === 'password-change-required') {
          const current = userRef.current;
          if (current && !current.mustChangePassword) commitUser({ ...current, mustChangePassword: true });
        } else if (event === 'upgrade-required') {
          setUpgradeRequired(true);
        }
      }),
    [commitUser, logout],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await adminLogin(email, password);
      if (!result.ok) {
        if (result.code === 'UPGRADE_REQUIRED') setUpgradeRequired(true);
        return result;
      }
      // Nothing cached for a previous account may survive into this one.
      await apolloClient.clearStore();
      localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
      commitUser(result.user);
      lastCheckedAt.current = Date.now();
      setBlocked(false);
      setLogoutReason(null);
      setStatus('authenticated');
      return result;
    },
    [commitUser],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const current = userRef.current;
      if (!current) return { ok: false as const, code: 'UNKNOWN' as const, status: 0 };
      const changed = await adminChangePassword(current.email, currentPassword, newPassword);
      if (!changed.ok) return changed;
      const relogin = await login(current.email, newPassword);
      if (!relogin.ok) logout('expired');
      return relogin;
    },
    [login, logout],
  );

  const value = useMemo<AuthState>(() => {
    const scope = scopeFromUser(user);
    return {
      user,
      status,
      scope,
      brand: user?.brand ?? null,
      isAuthenticated: status === 'authenticated' && !!user,
      isSuperAdmin: scope === 'PLATFORM',
      isBrandAdmin: scope === 'BRAND_ADMIN',
      mustChangePassword: !!user?.mustChangePassword,
      blocked,
      upgradeRequired,
      logoutReason,
      login,
      logout,
      changePassword,
      revalidate,
    };
  }, [user, status, blocked, upgradeRequired, logoutReason, login, logout, changePassword, revalidate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
