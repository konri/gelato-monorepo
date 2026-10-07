import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from './BrandScope';
import { BrandSwitcher } from '../components/BrandSwitcher';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Badge } from '../components/ui/Badge';

/**
 * PLATFORM support mode for one brand (/brands/:brandId/*): header with the
 * brand switcher, the support banner, the inactive banner and the brand tabs.
 */
export function BrandScopeLayout() {
  const { t } = useTranslation();
  const { brand, brandId, brandActive, paths } = useBrandScope();

  const tabs = [
    { to: paths.home, label: t('BrandTabs.profile'), end: true },
    { to: paths.spots, label: t('BrandTabs.spots') },
    { to: paths.rewards, label: t('BrandTabs.rewards') },
    { to: paths.promotions, label: t('BrandTabs.promotions') },
    { to: paths.staff, label: t('BrandTabs.staff') },
    { to: paths.orders, label: t('BrandTabs.orders') },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-6 pt-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/brands" className="text-sm text-gray-500 hover:text-brand">
            {t('BrandScope.backToBrands')}
          </Link>
          <BrandSwitcher currentBrandId={brandId} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <BrandLogo name={brand.name} logoUrl={brand.logoUrl} size="md" />
          <h1 className="truncate text-xl font-bold text-gray-900">{brand.name}</h1>
          {!brandActive && <Badge tone="amber">{t('Brands.inactiveBadge')}</Badge>}
        </div>
        <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {t('BrandScope.supportBanner', { brand: brand.name })}
        </div>
        {!brandActive && (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('BrandScope.inactiveBannerPlatform')}
          </div>
        )}
        <nav className="-mb-px mt-3 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold ${
                  isActive ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
