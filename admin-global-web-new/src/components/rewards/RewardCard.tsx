import { useTranslation } from 'react-i18next';
import { prizeStatus, type Prize, type PrizeStatus } from '../../graphql/prizes';
import { fmtDate, fmtNumber, localized } from '../../lib/format';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';

const STATUS_TONE: Record<PrizeStatus, BadgeTone> = { ACTIVE: 'green', DISABLED: 'gray', ARCHIVED: 'gray' };

/** "Available 01.10.2026 – 31.12.2026", "Available until …", "No time limit". */
export function RewardValidity({ prize }: { prize: Pick<Prize, 'validFrom' | 'validUntil'> }) {
  const { t } = useTranslation();
  const { validFrom, validUntil } = prize;
  if (validFrom && validUntil) {
    return <>{t('Prizes.validRange', { from: fmtDate(validFrom), until: fmtDate(validUntil) })}</>;
  }
  if (validUntil) return <>{t('Prizes.validUntil', { until: fmtDate(validUntil) })}</>;
  if (validFrom) return <>{t('Prizes.validFrom', { from: fmtDate(validFrom) })}</>;
  return <>{t('Prizes.validAlways')}</>;
}

/**
 * One reward: photo, status, cost, stock, validity and the actions
 * (Edit, Enable / Disable, Delete when never claimed, otherwise Archive).
 */
export function RewardCard({
  prize,
  now,
  busy,
  onEdit,
  onToggle,
  onRemove,
}: {
  prize: Prize;
  now: number;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const status = prizeStatus(prize);
  const archived = status === 'ARCHIVED';
  const soldOut = prize.quantity != null && prize.claimed >= prize.quantity;
  const notYet = !!prize.validFrom && new Date(prize.validFrom).getTime() > now;
  const ended = !!prize.validUntil && new Date(prize.validUntil).getTime() < now;

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white ${archived ? 'opacity-75' : ''}`}>
      <div className="relative h-36 bg-gray-100">
        {prize.imageUrl ? (
          <img src={prize.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
            🎁
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
          <Badge tone={STATUS_TONE[status]}>{t(`Prizes.status_${status}`)}</Badge>
          {!archived && soldOut && <Badge tone="red">{t('Prizes.soldOut')}</Badge>}
          {!archived && !soldOut && notYet && <Badge tone="blue">{t('Prizes.notYet')}</Badge>}
          {!archived && ended && <Badge tone="amber">{t('Prizes.ended')}</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-gray-900" title={prize.title}>
          {localized(prize.titleLocal, prize.title)}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-brand">{t('Prizes.cost', { points: fmtNumber(prize.pointsCost) })}</p>
        <p className="mt-1 text-xs text-gray-500">
          {prize.quantity != null
            ? t('Prizes.claimedOf', { claimed: fmtNumber(prize.claimed), quantity: fmtNumber(prize.quantity) })
            : t('Prizes.claimedUnlimited', { claimed: fmtNumber(prize.claimed) })}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          <RewardValidity prize={prize} />
        </p>
        {archived ? (
          <p className="mt-auto pt-3 text-xs text-gray-500">
            {t('Prizes.archivedOn', { date: fmtDate(prize.archivedAt) })} {t('Prizes.archivedHint')}
          </p>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 pt-3">
            <Button size="sm" variant="secondary" className="flex-1" onClick={onEdit} disabled={busy}>
              {t('Common.edit')}
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={onToggle} disabled={busy}>
              {prize.isActive ? t('Common.disable') : t('Common.enable')}
            </Button>
            <Button size="sm" variant="dangerOutline" onClick={onRemove} disabled={busy}>
              {prize.claimed > 0 ? t('Prizes.archive') : t('Common.delete')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
