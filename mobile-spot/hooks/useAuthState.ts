import { session, useSession, type SessionUser } from '@/contexts/SessionProvider';

interface User {
  id: string;
  email: string;
  firstName?: string;
  surname?: string;
  roles?: string[];
  profileType?: string;
  city?: string;
}

/**
 * Thin wrapper over the reactive session (contexts/SessionProvider.tsx), kept
 * with its old return shape for existing callers. Every instance now sees the
 * same state, so a login or logout anywhere updates the whole app.
 */
export const useAuthState = () => {
  const s = useSession();
  return {
    isLoggedIn: s.status === 'signedIn',
    user: (s.user as unknown as User | null) ?? null,
    token: s.token,
    isLoading: s.status === 'loading',
    updateAuthState: (user: User, token: string, refreshToken?: string) =>
      session.setAuth(user as unknown as SessionUser, token, refreshToken),
    clearAuthState: () => session.signOut(),
    refreshAuthState: () => session.load(),
  };
};
