import type { TFunction } from 'i18next';
import type { BadgeTone } from '../ui/Badge';
import type { BrandPromotionState, BrandTask } from '../../graphql/tasks';
import { fmtLocalDate } from '../../lib/schedule';

/** What a promotion is doing right now, for the card's status line. */
export type PromotionState =
  | { kind: 'LIVE'; until: string | null; timezone: string }
  | { kind: 'STARTS'; at: string; timezone: string }
  | { kind: 'STARTS_ON'; date: string }
  | { kind: 'ENDED' }
  | { kind: 'PAUSED' }
  | { kind: 'ARCHIVED' }
  | { kind: 'BRAND_INACTIVE' }
  /** ACTIVE, but no active spot in its scope (the server computes nothing for it). */
  | { kind: 'NO_LOCATION' }
  /** ACTIVE, has spots, but nothing coming up in the next days of its dates. */
  | { kind: 'NO_RUN' };

export const STATE_TONE: Record<PromotionState['kind'], BadgeTone> = {
  LIVE: 'green',
  STARTS: 'blue',
  STARTS_ON: 'blue',
  ENDED: 'gray',
  PAUSED: 'amber',
  ARCHIVED: 'gray',
  BRAND_INACTIVE: 'amber',
  NO_LOCATION: 'amber',
  NO_RUN: 'gray',
};

/**
 * Combines the task (status, dates) with the server's live view
 * (brandPromotions: active now / next start, per location time zone).
 * `today` is the brand's local date (YYYY-MM-DD).
 */
export function promotionState(
  task: Pick<BrandTask, 'status' | 'startsOn' | 'endsOn'>,
  live: BrandPromotionState | undefined,
  today: string,
  brandActive: boolean,
): PromotionState {
  if (task.status === 'ARCHIVED') return { kind: 'ARCHIVED' };
  if (task.status === 'PAUSED') return { kind: 'PAUSED' };
  if (task.endsOn && task.endsOn < today) return { kind: 'ENDED' };
  if (!brandActive) return { kind: 'BRAND_INACTIVE' };
  if (live?.isActiveNow) return { kind: 'LIVE', until: live.activeUntil ?? null, timezone: live.timezone };
  if (live?.nextStartsAt) return { kind: 'STARTS', at: live.nextStartsAt, timezone: live.timezone };
  if (task.startsOn && task.startsOn > today) return { kind: 'STARTS_ON', date: task.startsOn };
  return live ? { kind: 'NO_RUN' } : { kind: 'NO_LOCATION' };
}

/** "From 01.10.2026 to 31.12.2026", "From …", "Until …" or "No end date". */
export function datesText(task: Pick<BrandTask, 'startsOn' | 'endsOn'>, t: TFunction): string {
  const { startsOn, endsOn } = task;
  if (startsOn && endsOn) return t('Promotions.datesRange', { from: fmtLocalDate(startsOn), until: fmtLocalDate(endsOn) });
  if (startsOn) return t('Promotions.datesFrom', { from: fmtLocalDate(startsOn) });
  if (endsOn) return t('Promotions.datesUntil', { until: fmtLocalDate(endsOn) });
  return t('Promotions.datesOpen');
}
