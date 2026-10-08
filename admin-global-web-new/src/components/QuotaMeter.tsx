import { useTranslation } from 'react-i18next';
import type { SpotQuota } from '../graphql/brands';
import { DRAFT_SPOT_ALLOWANCE } from '../lib/constants';

/**
 * Active spots against the plan's maxSpots: amber from 80 % (a full plan is
 * normal, e.g. right after activating the only spot), red only above the
 * plan (BRANDS_SPEC §3.3). `compact` drops the drafts line.
 */
export function QuotaMeter({ quota, compact = false }: { quota: SpotQuota; compact?: boolean }) {
  const { t } = useTranslation();
  const { activeSpots, maxSpots, totalSpots } = quota;
  const ratio = maxSpots > 0 ? activeSpots / maxSpots : activeSpots > 0 ? Infinity : 0;
  const full = maxSpots === 0 || ratio >= 1;
  const tone = ratio > 1 ? 'red' : ratio >= 0.8 ? 'amber' : 'green';
  const bar = { red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-green-500' }[tone];
  const text = { red: 'text-red-700', amber: 'text-amber-700', green: 'text-gray-700' }[tone];
  const width = maxSpots > 0 ? Math.min(100, Math.round(ratio * 100)) : activeSpots > 0 ? 100 : 0;
  const notActive = Math.max(0, totalSpots - activeSpots);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-gray-500">{t('Quota.activeSpots')}</span>
        <span className={`font-semibold ${text}`}>
          {t('Quota.used', { active: activeSpots, max: maxSpots })}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={maxSpots}
        aria-valuenow={activeSpots}
        aria-label={t('Quota.activeSpots')}
      >
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-gray-500">
          {activeSpots > maxSpots
            ? t('Quota.overLimit')
            : full
              ? t('Quota.limitReached')
              : t('Quota.notActive', { notActive, total: maxSpots + DRAFT_SPOT_ALLOWANCE })}
        </p>
      )}
    </div>
  );
}
