import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useOptionalBrandScope, type BrandScopeValue } from '../brand/BrandScope';
import { brandPaths } from '../brand/paths';
import {
  BRAND_SPOTS,
  MY_ADMIN_SPOTS,
  SET_SPOT_ACTIVE,
  spotStatus,
  type AdminSpot,
  type SpotStatus,
} from '../graphql/spots';
import { errorText } from '../lib/errors';
import { mountedQueries } from '../lib/cachePolicies';
import { cityName } from '../lib/format';
import { QuotaMeter } from '../components/QuotaMeter';
import { ActivationChecklist } from '../components/ActivationChecklist';
import { BrandLogo } from '../components/brand/BrandLogo';
import { PageHeader } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

type StatusFilter = 'ALL' | SpotStatus;

const STATUS_TONE: Record<SpotStatus, BadgeTone> = { ACTIVE: 'green', DRAFT: 'blue', INACTIVE: 'gray' };

/**
 * Spots (BRANDS_SPEC §3.3). In a brand scope: the brand's spots with the plan
 * usage and "+ Create spot". On the platform tree (/spots): every spot, with
 * a brand filter; spots are created from their brand.
 */
export function SpotsPage() {
  const scope = useOptionalBrandScope();
  return scope ? <BrandSpots scope={scope} /> : <SpotDirectory />;
}

function BrandSpots({ scope }: { scope: BrandScopeValue }) {
  const { t } = useTranslation();
  const { brandId, brandActive, quota, totalCap, paths, brand, isPlatform } = scope;
  const { data, loading, error, refetch } = useQuery<{ brandSpots: AdminSpot[] }>(BRAND_SPOTS, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const atTotalCap = quota.totalSpots >= totalCap;
  const createBlocked = !brandActive || atTotalCap || brand.cityIds.length === 0;
  const blockedReason = !brandActive
    ? t('Spots.createBlockedInactive')
    : atTotalCap
      ? t('Errors.SPOT_LIMIT_TOTAL', { total: totalCap })
      : brand.cityIds.length === 0
        ? t('CreateSpot.noCities')
        : null;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader
        title={t('Spots.title')}
        subtitle={isPlatform ? t('Spots.subtitlePlatform', { brand: brand.name }) : t('Spots.subtitle')}
        actions={
          createBlocked ? (
            <Button disabled title={blockedReason ?? undefined}>
              {t('Spots.createSpot')}
            </Button>
          ) : (
            <ButtonLink to={paths.newSpot}>{t('Spots.createSpot')}</ButtonLink>
          )
        }
      />
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4">
          <QuotaMeter quota={quota} />
        </div>
        {blockedReason && (
          <Alert tone="warning" className="min-w-[16rem] flex-1">
            {blockedReason}
          </Alert>
        )}
      </div>
      <SpotList
        spots={data?.brandSpots}
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        canActivate={brandActive && quota.activeSpots < quota.maxSpots}
        emptyAction={createBlocked ? undefined : <ButtonLink to={paths.newSpot}>{t('Spots.createFirstSpot')}</ButtonLink>}
        pathsFor={() => paths}
      />
    </div>
  );
}

function SpotDirectory() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery<{ myAdminSpots: AdminSpot[] }>(MY_ADMIN_SPOTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [brandId, setBrandId] = useState('');
  const spots = data?.myAdminSpots;
  const brands = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of spots ?? []) map.set(s.brand.id, s.brand.name);
    return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [spots]);
  const visible = useMemo(() => (spots && brandId ? spots.filter((s) => s.brandId === brandId) : spots), [spots, brandId]);

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader title={t('Spots.directoryTitle')} subtitle={t('Spots.directorySubtitle')} />
      {brands.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label={t('Spots.brandFilter')}>
            <option value="">{t('Spots.allBrands')}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <SpotList
        spots={visible}
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        showBrand
        canActivate
        emptyAction={<ButtonLink to="/brands" variant="secondary">{t('Spots.goToBrands')}</ButtonLink>}
        emptyHint={t('Spots.directoryEmptyHint')}
        pathsFor={(spot) => ({ ...brandPaths('param', spot.brandId), ordersFor: (id: string) => `/orders?spot=${encodeURIComponent(id)}` })}
      />
    </div>
  );
}

type SpotPaths = Pick<ReturnType<typeof brandPaths>, 'editSpot' | 'staffFor' | 'ordersFor'>;

function SpotList({
  spots,
  loading,
  error,
  onRetry,
  showBrand = false,
  canActivate,
  emptyAction,
  emptyHint,
  pathsFor,
}: {
  spots: AdminSpot[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  showBrand?: boolean;
  /** False when the plan's active-spot limit is reached (brand scope). */
  canActivate: boolean;
  emptyAction?: React.ReactNode;
  emptyHint?: string;
  pathsFor: (spot: AdminSpot) => SpotPaths;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [cityId, setCityId] = useState('');
  const [activating, setActivating] = useState<AdminSpot | null>(null);
  const [deactivating, setDeactivating] = useState<AdminSpot | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const client = useApolloClient();
  const [setActive, { loading: saving }] = useMutation(SET_SPOT_ACTIVE, {
    refetchQueries: () => mountedQueries(client, ['AdminBrand', 'AdminBrands']),
  });

  const all = useMemo(() => spots ?? [], [spots]);
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: all.length, DRAFT: 0, ACTIVE: 0, INACTIVE: 0 };
    for (const s of all) c[spotStatus(s)]++;
    return c;
  }, [all]);
  const cities = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of all) if (s.city) map.set(s.city.id, cityName(s.city));
    return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((s) => status === 'ALL' || spotStatus(s) === status)
      .filter((s) => !cityId || s.cityId === cityId)
      .filter((s) => !q || [s.name, s.address, s.phone ?? '', s.brand.name].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, status, cityId, query]);

  const deactivate = async () => {
    if (!deactivating) return;
    setDeactivateError(null);
    try {
      await setActive({ variables: { spotId: deactivating.id, isActive: false } });
      setDeactivating(null);
    } catch (err) {
      setDeactivateError(errorText(err));
    }
  };

  return (
    <>
      <div className="mb-5 space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Spots.searchPlaceholder')}
          aria-label={t('Spots.searchPlaceholder')}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'DRAFT', 'ACTIVE', 'INACTIVE'] as StatusFilter[]).map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} count={counts[s]}>
              {t(`Spots.filter_${s}`)}
            </FilterChip>
          ))}
        </div>
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={cityId === ''} onClick={() => setCityId('')}>
              {t('Spots.allCities')}
            </FilterChip>
            {cities.map((c) => (
              <FilterChip key={c.id} active={cityId === c.id} onClick={() => setCityId(c.id)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {Boolean(error) && (
        <Alert
          tone="error"
          className="mb-4"
          action={
            <Button size="sm" variant="secondary" onClick={onRetry}>
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(error)}
        </Alert>
      )}
      {loading && !spots && <FullPageSpinner inline />}
      {spots && all.length === 0 && (
        <EmptyState title={t('Spots.noSpotsYet')} description={emptyHint ?? t('Spots.noSpotsHint')} action={emptyAction} />
      )}
      {all.length > 0 && filtered.length === 0 && <EmptyState title={t('Spots.noSpotsMatch')} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((spot) => {
          const st = spotStatus(spot);
          const p = pathsFor(spot);
          return (
            <div key={spot.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate font-semibold text-gray-900" title={spot.name}>
                  {spot.name}
                </h3>
                <Badge tone={STATUS_TONE[st]}>{t(`Spots.status_${st}`)}</Badge>
              </div>
              {showBrand && (
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <BrandLogo name={spot.brand.name} logoUrl={spot.brand.logoUrl} size="sm" />
                  <span className="truncate font-medium">{spot.brand.name}</span>
                  {!spot.brand.isActive && <Badge tone="amber">{t('Brands.inactiveBadge')}</Badge>}
                </div>
              )}
              {spot.city && <p className="mt-1 text-xs font-medium text-brand">{cityName(spot.city)}</p>}
              <p className="mt-1 text-sm text-gray-500">{spot.address}</p>
              {spot.phone && <p className="mt-1 text-xs text-gray-400">{spot.phone}</p>}
              {st === 'DRAFT' && <p className="mt-2 text-xs text-blue-700">{t('Spots.draftHint')}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-sm font-semibold">
                <Link to={p.editSpot(spot.id)} className="inline-flex min-h-11 items-center text-brand hover:text-brand-dark md:min-h-0">
                  {t('Common.edit')}
                </Link>
                <Link to={p.staffFor({ spotId: spot.id })} className="inline-flex min-h-11 items-center text-brand hover:text-brand-dark md:min-h-0">
                  {t('Spots.staff')}
                </Link>
                <Link to={p.ordersFor(spot.id)} className="inline-flex min-h-11 items-center text-brand hover:text-brand-dark md:min-h-0">
                  {t('Spots.orderHistory')}
                </Link>
                <span className="ml-auto">
                  {spot.isActive ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDeactivateError(null);
                        setDeactivating(spot);
                      }}
                    >
                      {t('Spots.deactivate')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canActivate || !spot.brand.isActive}
                      title={!canActivate ? t('Quota.limitReached') : undefined}
                      onClick={() => setActivating(spot)}
                    >
                      {t('Spots.activate')}
                    </Button>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activating && <ActivationChecklist spot={activating} onClose={() => setActivating(null)} />}
      {deactivating && (
        <ConfirmDialog
          title={t('Spots.deactivateTitle', { name: deactivating.name })}
          body={t('Spots.deactivateBody')}
          confirmLabel={t('Spots.deactivate')}
          tone="danger"
          busy={saving}
          error={deactivateError}
          onCancel={() => setDeactivating(null)}
          onConfirm={() => void deactivate()}
        />
      )}
    </>
  );
}
