import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../brand/BrandScope';
import {
  BRAND_PROMOTIONS,
  BRAND_TASKS,
  DELETE_BRAND_TASK,
  SET_BRAND_TASK_STATUS,
  type BrandPromotionState,
  type BrandTask,
  type BrandTaskStatus,
} from '../graphql/tasks';
import { BRAND_SPOTS, type AdminSpot } from '../graphql/spots';
import { evictRoot } from '../lib/cachePolicies';
import { errorText } from '../lib/errors';
import { localDateIn, newRange } from '../lib/schedule';
import { LOCALIZED_LANGS, type LocalizedValue } from '../lib/localizedText';
import { useNow } from '../lib/useNow';
import i18n from '../translations';
import { PromotionCard, type PromotionAction } from '../components/promotions/PromotionCard';
import { PromotionModal, type PromotionDraft } from '../components/promotions/PromotionModal';
import { BonusSettingsCard } from '../components/promotions/BonusSettingsCard';
import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

type View = 'CURRENT' | 'ARCHIVED';

const THURSDAY = 4;

/** "Start from this example": ×2 on Thursdays 10:00–14:00, titled in every language. */
function exampleDraft(): PromotionDraft {
  const canonical = i18n.t('Promotions.exampleTitle');
  const title: LocalizedValue = { canonical, pl: '', en: '', ua: '' };
  for (const lang of LOCALIZED_LANGS) {
    const text = i18n.getFixedT(lang)('Promotions.exampleTitle');
    title[lang] = text === canonical ? '' : text;
  }
  return { title, multiplierPercent: 200, ranges: [newRange([THURSDAY], '10:00', '14:00')] };
}

/**
 * Promotions (BRANDS_SPEC §3.3): the brand's points multipliers with their
 * live state, the editor, and the bonus settings card.
 */
export function PromotionsPage() {
  const { t } = useTranslation();
  const { brandId, brand, brandActive } = useBrandScope();
  const now = useNow();
  const tasksQuery = useQuery<{ brandTasks: BrandTask[] }>(BRAND_TASKS, {
    variables: { brandId, includeArchived: true },
    fetchPolicy: 'cache-and-network',
  });
  const liveQuery = useQuery<{ brandPromotions: BrandPromotionState[] }>(BRAND_PROMOTIONS, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const spotsQuery = useQuery<{ brandSpots: AdminSpot[] }>(BRAND_SPOTS, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const evictLive = { update: (cache: Parameters<typeof evictRoot>[0]) => evictRoot(cache, ['brandPromotions']) };
  const [setStatus] = useMutation<{ setBrandTaskStatus: BrandTask }>(SET_BRAND_TASK_STATUS, evictLive);
  const [deleteTask] = useMutation(DELETE_BRAND_TASK, evictLive);

  const [view, setView] = useState<View>('CURRENT');
  const [modal, setModal] = useState<{ taskId: string | null; draft: PromotionDraft | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandTask | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tasks = useMemo(() => tasksQuery.data?.brandTasks ?? [], [tasksQuery.data]);
  const spots = useMemo(() => spotsQuery.data?.brandSpots ?? [], [spotsQuery.data]);
  const live = useMemo(
    () => new Map((liveQuery.data?.brandPromotions ?? []).map((p) => [p.taskId, p])),
    [liveQuery.data],
  );
  const spotNames = useMemo(() => new Map(spots.map((s) => [s.id, s.name])), [spots]);
  const brandZones = useMemo(
    () => [...new Set(brand.cities.map((c) => c.timezone).filter((z): z is string => !!z))].sort(),
    [brand.cities],
  );
  const today = localDateIn(brandZones[0] ?? 'Europe/Warsaw', new Date(now));

  const current = tasks.filter((task) => task.status !== 'ARCHIVED');
  const archived = tasks.filter((task) => task.status === 'ARCHIVED');
  const visible = view === 'CURRENT' ? current : archived;
  const editing = modal?.taskId ? tasks.find((task) => task.id === modal.taskId) ?? null : null;

  const open = (taskId: string | null, draft: PromotionDraft | null = null) => {
    setNotice(null);
    setActionError(null);
    setModal({ taskId, draft });
  };

  const changeStatus = async (task: BrandTask, status: BrandTaskStatus, message: string) => {
    setActionError(null);
    setNotice(null);
    setRowBusy(task.id);
    try {
      await setStatus({ variables: { id: task.id, status } });
      setNotice(message);
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setRowBusy(null);
    }
  };

  const onAction = (task: BrandTask, action: PromotionAction) => {
    switch (action) {
      case 'edit':
        open(task.id);
        break;
      case 'pause':
        void changeStatus(task, 'PAUSED', t('Promotions.pausedNotice', { title: task.title }));
        break;
      case 'resume':
        void changeStatus(task, 'ACTIVE', t('Promotions.resumedNotice', { title: task.title }));
        break;
      case 'archive':
        void changeStatus(task, 'ARCHIVED', t('Promotions.archivedNotice', { title: task.title }));
        break;
      case 'restore':
        void changeStatus(task, 'PAUSED', t('Promotions.restoredNotice', { title: task.title }));
        break;
      case 'delete':
        setDeleteError(null);
        setDeleteTarget(task);
        break;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteTask({ variables: { id: deleteTarget.id } });
      // The server archives a promotion that orders already refer to, so look at the result.
      const res = await tasksQuery.refetch();
      const kept = res.data?.brandTasks.some((task) => task.id === deleteTarget.id);
      setNotice(
        kept
          ? t('Promotions.deleteArchivedNotice', { title: deleteTarget.title })
          : t('Promotions.deletedNotice', { title: deleteTarget.title }),
      );
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(errorText(err));
    } finally {
      setDeleting(false);
    }
  };

  const loadError = tasksQuery.error ?? liveQuery.error;
  const createDisabledReason = !brandActive ? t('Promotions.createBlockedInactive') : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 sm:p-8">
      <PageHeader
        title={t('Promotions.title')}
        subtitle={t('Promotions.subtitle')}
        actions={
          <Button
            disabled={!!createDisabledReason}
            title={createDisabledReason ?? undefined}
            onClick={() => open(null)}
          >
            {t('Promotions.create')}
          </Button>
        }
      />

      {createDisabledReason && <Alert tone="warning">{createDisabledReason}</Alert>}
      {notice && (
        <Alert
          tone="success"
          action={
            <button type="button" className="text-xs font-semibold underline" onClick={() => setNotice(null)}>
              {t('Common.close')}
            </button>
          }
        >
          {notice}
        </Alert>
      )}
      {actionError && <Alert tone="error">{actionError}</Alert>}
      {loadError && (
        <Alert
          tone="error"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void tasksQuery.refetch();
                void liveQuery.refetch();
              }}
            >
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(loadError)}
        </Alert>
      )}

      <section>
        {tasks.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <FilterChip active={view === 'CURRENT'} onClick={() => setView('CURRENT')} count={current.length}>
              {t('Promotions.viewCurrent')}
            </FilterChip>
            <FilterChip active={view === 'ARCHIVED'} onClick={() => setView('ARCHIVED')} count={archived.length}>
              {t('Promotions.viewArchived')}
            </FilterChip>
            <span className="text-xs text-gray-500">{t('Promotions.overlapNote')}</span>
          </div>
        )}

        {tasksQuery.loading && !tasksQuery.data && <FullPageSpinner inline />}
        {tasksQuery.data && tasks.length === 0 && (
          <EmptyState
            title={t('Promotions.empty')}
            description={t('Promotions.emptyHint')}
            action={
              brandActive ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => open(null, exampleDraft())}>{t('Promotions.startFromExample')}</Button>
                  <Button variant="secondary" onClick={() => open(null)}>
                    {t('Promotions.create')}
                  </Button>
                </div>
              ) : undefined
            }
          />
        )}
        {tasks.length > 0 && visible.length === 0 && (
          <EmptyState title={view === 'CURRENT' ? t('Promotions.noCurrent') : t('Promotions.noArchived')} />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((task) => (
            <PromotionCard
              key={task.id}
              task={task}
              live={live.get(task.id)}
              today={today}
              brandActive={brandActive}
              spotNames={task.spotIds.map((id) => spotNames.get(id) ?? t('Promotions.unknownSpot'))}
              busy={rowBusy === task.id}
              onAction={(action) => onAction(task, action)}
            />
          ))}
        </div>
      </section>

      <BonusSettingsCard key={`bonuses-${brandId}`} />

      {modal && (modal.taskId === null || editing) && (
        <PromotionModal
          brandId={brandId}
          task={editing}
          draft={modal.draft}
          spots={spots}
          fallbackTimeZones={brandZones}
          onClose={() => setModal(null)}
          onSaved={(message) => setNotice(message)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={t('Promotions.deleteTitle', { title: deleteTarget.title })}
          body={t('Promotions.deleteBody')}
          confirmLabel={t('Common.delete')}
          tone="danger"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
