import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { BrandPromotionState, BrandTask } from '../../graphql/tasks';
import { fmtNumber, localized } from '../../lib/format';
import { fmtInstantIn, fmtLocalDate, fmtMultiplier, scheduleLines, localDateIn } from '../../lib/schedule';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { datesText, promotionState, STATE_TONE, type PromotionState } from './promotionState';

export type PromotionAction = 'edit' | 'pause' | 'resume' | 'archive' | 'restore' | 'delete';

/** Status badge text and the detail under it. */
function stateText(state: PromotionState, today: string, t: TFunction): { label: string; detail?: string } {
  switch (state.kind) {
    case 'LIVE': {
      if (!state.until) return { label: t('Promotions.state_LIVE') };
      const sameDay = localDateIn(state.timezone, new Date(state.until)) === today;
      return {
        label: t('Promotions.state_LIVE'),
        detail: t('Promotions.liveUntil', { time: fmtInstantIn(state.until, state.timezone, !sameDay) }),
      };
    }
    case 'STARTS':
      return { label: t('Promotions.state_STARTS', { date: fmtInstantIn(state.at, state.timezone) }) };
    case 'STARTS_ON':
      return { label: t('Promotions.state_STARTS', { date: fmtLocalDate(state.date) }) };
    case 'NO_LOCATION':
      return { label: t('Promotions.state_IDLE'), detail: t('Promotions.idleNoLocation') };
    case 'NO_RUN':
      return { label: t('Promotions.state_IDLE'), detail: t('Promotions.idleNoRun') };
    case 'BRAND_INACTIVE':
      return { label: t('Promotions.state_IDLE'), detail: t('Promotions.idleBrandInactive') };
    default:
      return { label: t(`Promotions.state_${state.kind}`) };
  }
}

/**
 * One promotion (BRANDS_SPEC §3.3): status (Live now / Starts … / Ended …),
 * multiplier, schedule, dates, spots, what it applies to, how often it was
 * applied, and Pause / Resume / Archive / Delete. Kinds this console does not
 * know are shown read-only.
 */
export function PromotionCard({
  task,
  live,
  today,
  brandActive,
  spotNames,
  busy,
  onAction,
}: {
  task: BrandTask;
  live: BrandPromotionState | undefined;
  /** Brand's local date (YYYY-MM-DD). */
  today: string;
  brandActive: boolean;
  /** Names of the spots in its scope (empty = every spot). */
  spotNames: string[];
  busy: boolean;
  onAction: (action: PromotionAction) => void;
}) {
  const { t } = useTranslation();
  const known = task.kind === 'POINTS_MULTIPLIER';
  const state = promotionState(task, live, today, brandActive);
  const { label, detail } = stateText(state, today, t);
  const lines = scheduleLines(task.windows, {
    always: t('Promotions.scheduleAlways'),
    everyDay: t('Promotions.everyDay'),
    allDay: t('Promotions.allDay'),
  });
  const appliesTo = [
    task.appliesToOrders ? t('Promotions.appliesOrders') : null,
    task.appliesToTemplateAwards ? t('Promotions.appliesCounter') : null,
  ].filter(Boolean);
  const archived = task.status === 'ARCHIVED';
  const neverApplied = task.timesApplied === 0;

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white p-5 ${archived ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-light text-lg font-bold text-brand">
          {known && task.multiplierPercent ? fmtMultiplier(task.multiplierPercent) : '—'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATE_TONE[state.kind]}>{label}</Badge>
            {detail && <span className="text-xs text-gray-500">{detail}</span>}
          </div>
          <h3 className="mt-1 truncate font-semibold text-gray-900" title={task.title}>
            {localized(task.titleLocal, task.title)}
          </h3>
        </div>
      </div>

      {known ? (
        <dl className="mt-4 space-y-1.5 text-sm">
          <Row label={t('Promotions.rowWhen')}>
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Row>
          <Row label={t('Promotions.rowDates')}>{datesText(task, t)}</Row>
          <Row label={t('Promotions.rowSpots')}>
            {spotNames.length === 0 ? t('Promotions.allSpots') : spotNames.join(', ')}
          </Row>
          <Row label={t('Promotions.rowAppliesTo')}>{appliesTo.join(' · ')}</Row>
          <Row label={t('Promotions.rowApplied')}>{fmtNumber(task.timesApplied)}</Row>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-gray-500">{t('Promotions.unknownKind')}</p>
      )}

      {known && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {archived ? (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('restore')}>
              {t('Promotions.restore')}
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('edit')}>
                {t('Common.edit')}
              </Button>
              {task.status === 'ACTIVE' ? (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('pause')}>
                  {t('Promotions.pause')}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('resume')}>
                  {t('Promotions.resume')}
                </Button>
              )}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('archive')}>
                {t('Promotions.archive')}
              </Button>
            </>
          )}
          {neverApplied && (
            <Button size="sm" variant="dangerOutline" disabled={busy} onClick={() => onAction('delete')}>
              {t('Common.delete')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="min-w-0 text-gray-800">{children}</dd>
    </div>
  );
}
