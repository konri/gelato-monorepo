import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { ADMIN_BRAND, type Brand, type BrandAdminView, type SpotQuota } from '../graphql/brands';
import { errorText } from '../lib/errors';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';
import { Alert } from '../components/ui/Alert';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { DRAFT_SPOT_ALLOWANCE } from '../lib/constants';
import { brandPaths, type BrandPaths, type BrandScopeSource } from './paths';

/**
 * The brand a page works on (BRANDS_SPEC §3.2). The same brand pages serve a
 * BRAND_ADMIN (brand from the session, routes at the root: /brand, /spots, …)
 * and PLATFORM support mode (brand from the URL: /brands/:brandId/…).
 */

export type BrandScopeValue = {
  brandId: string;
  /** ADMIN_BRAND: brand, settings, quota, counts (billingNote for PLATFORM). */
  view: BrandAdminView;
  brand: Brand;
  /** PLATFORM support mode (not the brand's own admin). */
  isPlatform: boolean;
  brandActive: boolean;
  quota: SpotQuota;
  /** Spots allowed in total, drafts included (maxSpots + 5). */
  totalCap: number;
  paths: BrandPaths;
  refetch: () => Promise<unknown>;
};

const BrandScopeContext = createContext<BrandScopeValue | null>(null);

export function BrandScopeProvider({
  source,
  children,
}: {
  source: BrandScopeSource;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const params = useParams<{ brandId: string }>();
  const brandId = source === 'self' ? user?.brand?.id : params.brandId;

  const { data, loading, error, refetch } = useQuery<{ adminBrand: BrandAdminView | null }>(ADMIN_BRAND, {
    variables: { id: brandId ?? '' },
    skip: !brandId,
    fetchPolicy: 'cache-and-network',
  });

  const view = data?.adminBrand ?? null;
  const value = useMemo<BrandScopeValue | null>(() => {
    if (!brandId || !view) return null;
    return {
      brandId,
      view,
      brand: view.brand,
      isPlatform: source === 'param',
      brandActive: view.brand.isActive,
      quota: view.quota,
      totalCap: view.quota.maxSpots + DRAFT_SPOT_ALLOWANCE,
      paths: brandPaths(source, brandId),
      refetch: () => refetch(),
    };
  }, [brandId, view, source, refetch]);

  if (!brandId) {
    return <EmptyState className="m-8" title={t('BrandScope.noBrand')} />;
  }
  if (!value) {
    if (loading) return <FullPageSpinner inline />;
    if (error) {
      return (
        <div className="p-8">
          <Alert
            tone="error"
            title={t('BrandScope.loadFailed')}
            action={
              <Button size="sm" variant="secondary" onClick={() => void refetch()}>
                {t('Common.retry')}
              </Button>
            }
          >
            {errorText(error)}
          </Alert>
        </div>
      );
    }
    return (
      <EmptyState
        className="m-8"
        title={t('BrandScope.notFound')}
        action={
          source === 'param' ? (
            <ButtonLink to="/brands" variant="secondary">
              {t('BrandScope.allBrands')}
            </ButtonLink>
          ) : undefined
        }
      />
    );
  }

  return <BrandScopeContext.Provider value={value}>{children ?? <Outlet />}</BrandScopeContext.Provider>;
}

/** The current brand scope; throws outside a BrandScopeProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBrandScope(): BrandScopeValue {
  const ctx = useContext(BrandScopeContext);
  if (!ctx) throw new Error('useBrandScope must be used within BrandScopeProvider');
  return ctx;
}

/** The current brand scope, or null outside one (e.g. the platform /spots directory). */
// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalBrandScope(): BrandScopeValue | null {
  return useContext(BrandScopeContext);
}
