import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { ADMIN_BRANDS, type BrandAdminView } from '../graphql/brands';
import { errorText } from '../lib/errors';
import { cityName } from '../lib/format';
import { QuotaMeter } from '../components/QuotaMeter';
import { BrandLogo } from '../components/brand/BrandLogo';
import { PageHeader } from '../components/ui/Card';
import { ButtonLink, Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Field';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

type Filter = 'ALL' | 'ACTIVE' | 'INACTIVE';

/** PLATFORM: every brand with its plan usage (BRANDS_SPEC §3.3). */
export function BrandsPage() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery<{ adminBrands: BrandAdminView[] }>(ADMIN_BRANDS, {
    fetchPolicy: 'cache-and-network',
  });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const brands = useMemo(() => data?.adminBrands ?? [], [data]);
  const counts = useMemo(
    () => ({
      ALL: brands.length,
      ACTIVE: brands.filter((b) => b.brand.isActive).length,
      INACTIVE: brands.filter((b) => !b.brand.isActive).length,
    }),
    [brands],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands
      .filter((b) => (filter === 'ALL' ? true : filter === 'ACTIVE' ? b.brand.isActive : !b.brand.isActive))
      .filter((b) => !q || b.brand.name.toLowerCase().includes(q))
      .sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  }, [brands, filter, query]);

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader
        title={t('Brands.title')}
        subtitle={t('Brands.subtitle')}
        actions={<ButtonLink to="/brands/new">{t('Brands.create')}</ButtonLink>}
      />

      <div className="mb-5 space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Brands.searchPlaceholder')}
          aria-label={t('Brands.searchPlaceholder')}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as Filter[]).map((f) => (
            <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} count={counts[f]}>
              {t(`Brands.filter_${f}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      {error && (
        <Alert
          tone="error"
          className="mb-4"
          action={
            <Button size="sm" variant="secondary" onClick={() => void refetch()}>
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(error)}
        </Alert>
      )}

      {loading && !data && <FullPageSpinner inline />}

      {data && brands.length === 0 && (
        <EmptyState
          title={t('Brands.empty')}
          description={t('Brands.emptyHint')}
          action={<ButtonLink to="/brands/new">{t('Brands.create')}</ButtonLink>}
        />
      )}

      {brands.length > 0 && filtered.length === 0 && <EmptyState title={t('Brands.noMatch')} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((view) => (
          <BrandCard key={view.brand.id} view={view} />
        ))}
      </div>
    </div>
  );
}

function BrandCard({ view }: { view: BrandAdminView }) {
  const { t } = useTranslation();
  const { brand, quota, staffCount } = view;
  const overQuota = quota.activeSpots > quota.maxSpots;
  const cities = brand.cities.map((c) => cityName(c)).join(', ');

  return (
    <Link
      to={`/brands/${encodeURIComponent(brand.id)}`}
      className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <BrandLogo name={brand.name} logoUrl={brand.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{brand.name}</h3>
            {!brand.isActive && <Badge tone="amber">{t('Brands.inactiveBadge')}</Badge>}
            {overQuota && <Badge tone="red">{t('Quota.overLimitBadge')}</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500" title={cities}>
            {cities || t('Brands.noCities')}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <QuotaMeter quota={quota} compact />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>{t('Brands.totalSpots', { n: quota.totalSpots })}</span>
        <span>{t('Brands.staffCount', { n: staffCount })}</span>
        <span>{t('Brands.rewardCount', { n: brand.rewardCount })}</span>
      </div>
    </Link>
  );
}
