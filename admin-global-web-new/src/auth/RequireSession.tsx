import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type LogoutReason } from './AuthContext';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';
import { UseSpotAppPage } from '../pages/UseSpotAppPage';

function loginPath(reason: LogoutReason | null): string {
  if (reason === 'expired') return '/login?expired=1';
  if (reason === 'no_membership') return '/login?reason=no_membership';
  return '/login';
}

/**
 * Gate for the console (BRANDS_SPEC §3.1): a spinner while an older session
 * is revalidated, /login without a session, the spot-app page for an account
 * that became spot staff, and /change-password while the session is
 * restricted (mustChangePassword).
 */
export function RequireSession({
  allowRestricted = false,
  children,
}: {
  allowRestricted?: boolean;
  children?: ReactNode;
}) {
  const { status, user, blocked, mustChangePassword, logoutReason } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status !== 'authenticated' || !user) {
    return <Navigate to={loginPath(logoutReason)} replace state={{ from: location.pathname }} />;
  }
  if (blocked) return <UseSpotAppPage blocked />;
  if (mustChangePassword && !allowRestricted) return <Navigate to="/change-password" replace />;
  return <>{children ?? <Outlet />}</>;
}
