import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../brand/BrandScope';
import {
  ADMIN_PRIZES,
  DELETE_PRIZE,
  UPDATE_PRIZE,
  prizeStatus,
  type Prize,
  type PrizeStatus,
} from '../graphql/prizes';
import { errorText } from '../lib/errors';
import { useNow } from '../lib/useNow';
import { RewardCard } from '../components/rewards/RewardCard';
import { RewardModal } from '../components/rewards/RewardModal';
import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

type Filter = 'ALL' | PrizeStatus;
const FILTERS: Filter[] = ['ALL', 'ACTIVE', 'DISABLED', 'ARCHIVED'];

/**
 * Rewards of the brand (BRANDS_SPEC §3.3): every reward incl. disabled and
 * archived ones, filters, create / edit, enable / disable, and Delete
 * (never claimed) or Archive (claimed before; claimed codes stay redeemable).
 */
export function PrizesPage() {
  const { t } = useTranslation();
  const { brandId, brand, brandActive } = useBrandScope();
  const now = useNow();
  const { data, loading, error, refetch } = useQuery<{ brandPrizes: Prize[] }>(ADMIN_PRIZES, {
    variables: { brandId, includeArchived: true },
    fetchPolicy: 'cache-and-network',
  });
  const [updatePrize] = useMutation<{ updatePrize: Prize }>(UPDATE_PRIZE, { refetchQueries: ['AdminBrand'] });
  const [deletePrize] = useMutation(DELETE_PRIZE, { refetchQueries: ['AdminBrand'] });

  const [filter, setFilter] = useState<Filter>('ALL');
  const [modal, setModal] = useState<{ prizeId: string | null } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Prize | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const prizes = useMemo(() => data?.brandPrizes ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: prizes.length, ACTIVE: 0, DISABLED: 0, ARCHIVED: 0 };
    for (const p of prizes) c[prizeStatus(p)]++;
    return c;
  }, [prizes]);
  const visible = useMemo(() => {
    const order: Record<PrizeStatus, number> = { ACTIVE: 0, DISABLED: 1, ARCHIVED: 2 };
    return prizes
      .filter((p) => filter === 'ALL' || prizeStatus(p) === filter)
      .sort((a, b) => order[prizeStatus(a)] - order[prizeStatus(b)] || a.pointsCost - b.pointsCost);
  }, [prizes, filter]);
  const editing = modal?.prizeId ? prizes.find((p) => p.id === modal.prizeId) ?? null : null;

  const toggle = async (prize: Prize) => {
    setActionError(null);
    setNotice(null);
    setRowBusy(prize.id);
    try {
      await updatePrize({ variables: { id: prize.id, isActive: !prize.isActive } });
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async () => {
    if (!removeTarget) return;
    setRemoveError(null);
    setRemoving(true);
    try {
      await deletePrize({ variables: { id: removeTarget.id } });
      // The server archives a reward that was ever claimed, so look at the result.
      const res = await refetch();
      const stillThere = res.data?.brandPrizes.some((p) => p.id === removeTarget.id);
      setNotice(
        stillThere
          ? t('Prizes.archivedNotice', { title: removeTarget.title })
          : t('Prizes.deletedNotice', { title: removeTarget.title }),
      );
      setRemoveTarget(null);
    } catch (err) {
      setRemoveError(errorText(err));
    } finally {
      setRemoving(false);
    }
  };

  const createButton = (
    <Button
      disabled={!brandActive}
      title={!brandActive ? t('Prizes.createBlockedInactive') : undefined}
      onClick={() => {
        setNotice(null);
        setModal({ prizeId: null });
      }}
    >
      {t('Prizes.create')}
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader title={t('Prizes.title')} subtitle={t('Prizes.subtitle', { brand: brand.name })} actions={createButton} />

      {!brandActive && (
        <Alert tone="warning" className="mb-4">
          {t('Prizes.createBlockedInactive')}
        </Alert>
      )}
      {notice && (
        <Alert
          tone="success"
          className="mb-4"
          action={
            <button type="button" className="text-xs font-semibold underline" onClick={() => setNotice(null)}>
              {t('Common.close')}
            </button>
          }
        >
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}
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

      {prizes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} count={counts[f]}>
              {t(`Prizes.filter_${f}`)}
            </FilterChip>
          ))}
        </div>
      )}

      {loading && !data && <FullPageSpinner inline />}
      {data && prizes.length === 0 && (
        <EmptyState
          title={t('Prizes.empty')}
          description={t('Prizes.emptyHint')}
          action={brandActive ? createButton : undefined}
        />
      )}
      {prizes.length > 0 && visible.length === 0 && <EmptyState title={t('Prizes.noMatch')} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <RewardCard
            key={p.id}
            prize={p}
            now={now}
            busy={rowBusy === p.id}
            onEdit={() => {
              setNotice(null);
              setModal({ prizeId: p.id });
            }}
            onToggle={() => void toggle(p)}
            onRemove={() => {
              setRemoveError(null);
              setRemoveTarget(p);
            }}
          />
        ))}
      </div>

      {modal && (modal.prizeId === null || editing) && (
        <RewardModal
          brandId={brandId}
          prize={editing}
          onClose={() => setModal(null)}
          onSaved={(message) => setNotice(message)}
        />
      )}
      {removeTarget && (
        <ConfirmDialog
          title={
            removeTarget.claimed > 0
              ? t('Prizes.archiveTitle', { title: removeTarget.title })
              : t('Prizes.deleteTitle', { title: removeTarget.title })
          }
          body={removeTarget.claimed > 0 ? t('Prizes.archiveBody') : t('Prizes.deleteBody')}
          confirmLabel={removeTarget.claimed > 0 ? t('Prizes.archive') : t('Common.delete')}
          tone="danger"
          busy={removing}
          error={removeError}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
