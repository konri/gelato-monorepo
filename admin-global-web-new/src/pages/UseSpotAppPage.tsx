import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { SPOT_APP_URL } from '../lib/config';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';

/**
 * Spot admins and employees work in the Loodly Spot app (BRANDS_SPEC §3.1).
 * Reached from a 403 USE_SPOT_APP at sign-in (nothing stored), or `blocked`
 * when a signed-in account became spot staff.
 */
export function UseSpotAppPage({ blocked = false }: { blocked?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, logout } = useAuth();
  // A stored session (e.g. an account that became spot staff) offers sign-out.
  const signedIn = blocked || (status === 'authenticated' && !!user);
  const stateName = (location.state as { name?: unknown } | null)?.name;
  const name = signedIn ? user?.name || user?.email : typeof stateName === 'string' ? stateName : '';

  return (
    <AuthShell title={t('SpotApp.title')}>
      <p className="mb-2 text-sm text-gray-700">
        {name ? t('SpotApp.greeting', { name }) : t('SpotApp.greetingNoName')}
      </p>
      <p className="mb-6 text-sm text-gray-500">{t('SpotApp.body')}</p>
      <div className="space-y-2">
        {SPOT_APP_URL && (
          <a
            href={SPOT_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t('SpotApp.open')}
          </a>
        )}
        {/* The address too, for staff who will open it on another device. */}
        <p className="pb-1 text-center text-xs text-gray-500">{SPOT_APP_URL.replace(/^https?:\/\//, '')}</p>
        {signedIn ? (
          <Button variant="secondary" className="w-full" onClick={() => logout()}>
            {t('Nav.signOut')}
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => navigate('/login', { replace: true })}>
            {t('Login.backToSignIn')}
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
