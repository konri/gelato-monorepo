import { useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  SET_SPOT_ACTIVE,
  SPOT_MENU_COUNT,
  hasOpeningHours,
  type AdminSpot,
} from '../graphql/spots';
import { ADMIN_BRAND, type BrandAdminView } from '../graphql/brands';
import { useOptionalBrandScope } from '../brand/BrandScope';
import { errorText } from '../lib/errors';
import { mountedQueries } from '../lib/cachePolicies';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { QuotaMeter } from './QuotaMeter';

type Check = { key: string; ok: boolean | null; label: string; hint: string };

/**
 * Activation of a draft or inactive spot (BRANDS_SPEC §3.3): hours, menu and
 * a photo are checked as warnings only; the plan's active-spot limit and an
 * inactive brand block it.
 */
export function ActivationChecklist({
  spot,
  onClose,
  onActivated,
}: {
  spot: AdminSpot;
  onClose: () => void;
  onActivated?: (spot: AdminSpot) => void;
}) {
  const { t } = useTranslation();
  const scope = useOptionalBrandScope();
  const inScope = scope?.brandId === spot.brandId;

  const { data: menu, loading: menuLoading } = useQuery<{ spotTastes: { id: string }[]; spotProducts: { id: string }[] }>(
    SPOT_MENU_COUNT,
    { variables: { spotId: spot.id }, fetchPolicy: 'network-only' },
  );
  const { data: brandData } = useQuery<{ adminBrand: BrandAdminView | null }>(ADMIN_BRAND, {
    variables: { id: spot.brandId },
    skip: inScope,
    fetchPolicy: 'cache-and-network',
  });
  const view = inScope ? scope.view : brandData?.adminBrand ?? null;
  const quota = view?.quota ?? null;
  const brandActive = view ? view.brand.isActive : spot.brand.isActive;
  const atLimit = !!quota && quota.activeSpots >= quota.maxSpots;

  const client = useApolloClient();
  const [activate, { loading }] = useMutation<{ setSpotActive: AdminSpot }>(SET_SPOT_ACTIVE, {
    refetchQueries: () => mountedQueries(client, ['AdminBrand', 'AdminBrands']),
  });
  const [error, setError] = useState<string | null>(null);

  const menuCount = menu ? menu.spotTastes.length + menu.spotProducts.length : null;
  const checks: Check[] = [
    {
      key: 'hours',
      ok: hasOpeningHours(spot.openingHours),
      label: t('Activation.hours'),
      hint: t('Activation.hoursHint'),
    },
    {
      key: 'menu',
      ok: menuLoading || menuCount === null ? null : menuCount > 0,
      label: t('Activation.menu'),
      hint: t('Activation.menuHint'),
    },
    {
      key: 'photo',
      ok: !!(spot.logoUrl || spot.coverUrl || spot.photos.length > 0),
      label: t('Activation.photo'),
      hint: t('Activation.photoHint'),
    },
  ];
  const warnings = checks.filter((c) => c.ok === false).length;

  const submit = async () => {
    setError(null);
    try {
      const res = await activate({ variables: { spotId: spot.id, isActive: true } });
      if (res.data) onActivated?.(res.data.setSpotActive);
      onClose();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const blocked = !brandActive || atLimit;

  return (
    <Modal
      title={t('Activation.title', { name: spot.name })}
      onClose={onClose}
      busy={loading}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            {t('Common.cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => void submit()}
            disabled={blocked || !quota}
            loading={loading}
            loadingText={t('Common.saving')}
          >
            {warnings > 0 ? t('Activation.activateAnyway') : t('Activation.activate')}
          </Button>
        </>
      }
    >
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      <p className="mb-3 text-sm text-gray-600">{t('Activation.intro')}</p>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.key} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                c.ok === null
                  ? 'bg-gray-100 text-gray-400'
                  : c.ok
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {c.ok === null ? '…' : c.ok ? '✓' : '!'}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900">{c.label}</span>
              {c.ok === false && <span className="block text-xs text-gray-500">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      {warnings > 0 && <p className="mt-3 text-xs text-amber-700">{t('Activation.warningsOnly')}</p>}
      {quota && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <QuotaMeter quota={quota} compact />
        </div>
      )}
      {!brandActive && (
        <Alert tone="warning" className="mt-3">
          {t('BrandScope.inactiveBanner')}
        </Alert>
      )}
      {brandActive && atLimit && quota && (
        <Alert tone="warning" className="mt-3">
          {t('Quota.limitReachedLong', { max: quota.maxSpots })}
        </Alert>
      )}
    </Modal>
  );
}
