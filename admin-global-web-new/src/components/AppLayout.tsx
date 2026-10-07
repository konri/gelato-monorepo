import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useOptionalBrandScope } from '../brand/BrandScope';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './brand/BrandLogo';
import { Alert } from './ui/Alert';
import { useLeadCounts } from './leads/useLeadCounts';

/** `badge: 'newRequests'` shows the number of NEW partnership requests. */
type NavItem = { to: string; labelKey: string; icon: string; end?: boolean; badge?: 'newRequests' };

// Platform tree (SUPER_ADMIN). Quests are frozen and stay out of the nav.
const PLATFORM_NAV: NavItem[] = [
  { to: '/brands', labelKey: 'Nav.brands', icon: '🏷️' },
  { to: '/requests', labelKey: 'Nav.requests', icon: '📨', badge: 'newRequests' },
  { to: '/spots', labelKey: 'Nav.spots', icon: '📍' },
  { to: '/orders', labelKey: 'Nav.orderHistory', icon: '📦' },
  { to: '/payouts', labelKey: 'Nav.payouts', icon: '💰' },
  { to: '/admins', labelKey: 'Nav.accounts', icon: '👤' },
  { to: '/news', labelKey: 'Nav.newsNotifications', icon: '📣' },
];

// Brand tree (BRAND_ADMIN).
const BRAND_NAV: NavItem[] = [
  { to: '/brand', labelKey: 'Nav.brandProfile', icon: '🏠', end: true },
  { to: '/spots', labelKey: 'Nav.spots', icon: '📍' },
  { to: '/rewards', labelKey: 'Nav.rewards', icon: '🎁' },
  { to: '/promotions', labelKey: 'Nav.promotions', icon: '⚡' },
  { to: '/staff', labelKey: 'Nav.staff', icon: '👥' },
  { to: '/orders', labelKey: 'Nav.orderHistory', icon: '📦' },
];

/**
 * Console shell. `platform`: Loodly header and the platform sections.
 * `brand`: the brand's logo and name, the brand sections, and a banner while
 * the brand is inactive.
 */
export function AppLayout({ variant }: { variant: 'platform' | 'brand' }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const scope = useOptionalBrandScope();
  const nav = variant === 'platform' ? PLATFORM_NAV : BRAND_NAV;
  const brand = variant === 'brand' ? scope?.brand ?? null : null;
  // Polled every 60 s and refetched on focus; platform only (the query is SUPER_ADMIN-only).
  const leadCounts = useLeadCounts({ live: true, skip: variant !== 'platform' });
  const newRequests = leadCounts.data?.businessLeadCounts.new ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        {variant === 'brand' && brand ? (
          <div className="flex items-center gap-3 px-5 py-5">
            <BrandLogo name={brand.name} logoUrl={brand.logoUrl} size="md" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-5 text-gray-900" title={brand.name}>
                {brand.name}
              </div>
              <div className="text-xs font-semibold tracking-wide text-brand">{t('Nav.brandConsole')}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-5 py-5">
            <img src="/loodly-mark.svg" alt="Loodly" className="h-9 w-9" />
            <div>
              <div className="text-sm font-bold leading-4 text-gray-900">Loodly</div>
              <div className="text-xs font-semibold tracking-wide text-brand">{t('Nav.adminBadge')}</div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {/* Wraps instead of truncating: long labels (PL "Aktualności i powiadomienia") stay readable in the 240 px sidebar. */}
              <span className="min-w-0 break-words leading-5">{t(item.labelKey)}</span>
              {item.badge === 'newRequests' && newRequests > 0 && (
                <span
                  className="ml-auto shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold leading-4 text-white"
                  title={t('Nav.newRequests', { count: newRequests })}
                >
                  <span aria-hidden>{newRequests > 99 ? '99+' : newRequests}</span>
                  <span className="sr-only">{t('Nav.newRequests', { count: newRequests })}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="px-2 pb-2">
            <div className="truncate text-sm font-medium text-gray-900" title={user?.email}>
              {user?.name || user?.email}
            </div>
            <div className="text-xs text-gray-500">{user ? t(`Roles.${user.staffKind}`) : ''}</div>
          </div>
          <LanguageSwitcher className="mb-1 px-1" />
          <NavLink
            to="/change-password"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            {t('Nav.changePassword')}
          </NavLink>
          <button
            onClick={() => logout()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            {t('Nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-auto">
        {variant === 'brand' && scope && !scope.brandActive && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800 sm:px-8">
            {t('BrandScope.inactiveBanner')}
          </div>
        )}
        <FlashNotice />
        <Outlet />
      </main>
    </div>
  );
}

/**
 * One-time messages passed with navigate(…, { state: { notice, warning } }),
 * e.g. "Brand created" after CreateBrandPage.
 */
function FlashNotice() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as { notice?: unknown; warning?: unknown } | null;
  const notice = typeof state?.notice === 'string' ? state.notice : null;
  const warning = typeof state?.warning === 'string' ? state.warning : null;
  if (!notice && !warning) return null;

  const dismiss = () => navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  const close = (
    <button type="button" onClick={dismiss} className="text-xs font-semibold underline">
      {t('Common.close')}
    </button>
  );
  return (
    <div className="space-y-2 px-6 pt-6 sm:px-8">
      {notice && (
        <Alert tone="success" action={close}>
          {notice}
        </Alert>
      )}
      {warning && (
        <Alert tone="warning" action={notice ? undefined : close}>
          {warning}
        </Alert>
      )}
    </div>
  );
}
