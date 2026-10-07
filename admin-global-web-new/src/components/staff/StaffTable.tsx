import { useTranslation } from 'react-i18next';
import type { StaffActor } from '../../auth/scope';
import type { StaffMember } from '../../graphql/staff';
import { fmtDate } from '../../lib/format';
import { Badge } from '../ui/Badge';
import { StaffRowActions } from './StaffRowActions';
import { staffMenuActions, type StaffMenuAction } from './staffActions';

/** Pending (never signed in), Disabled or Active. */
export function StaffStatusBadge({ member }: { member: Pick<StaffMember, 'loginDisabled' | 'invitePending'> }) {
  const { t } = useTranslation();
  if (member.loginDisabled) return <Badge tone="red">{t('StaffStatus.disabled')}</Badge>;
  if (member.invitePending) return <Badge tone="amber">{t('StaffStatus.pending')}</Badge>;
  return <Badge tone="green">{t('StaffStatus.active')}</Badge>;
}

/**
 * The staff list (BRANDS_SPEC §3.3): person, role, spot chips, status and
 * the actions the caller may take. Rows, not a scrolling table, so the
 * actions menu is never clipped.
 */
export function StaffTable({
  members,
  actor,
  spotNames,
  busyId,
  onAction,
}: {
  members: StaffMember[];
  actor: StaffActor;
  spotNames: Map<string, string>;
  busyId: string | null;
  onAction: (member: StaffMember, action: StaffMenuAction) => void;
}) {
  const { t } = useTranslation();

  return (
    // From xl up the rows share one grid (subgrid), so the role and status
    // columns take the width of their longest label in every language.
    <div className="rounded-xl border border-gray-200 bg-white xl:grid xl:grid-cols-[minmax(0,2fr)_auto_minmax(0,2fr)_auto_auto] xl:gap-x-4">
      <div className="hidden border-b border-gray-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 xl:col-span-5 xl:grid xl:grid-cols-subgrid xl:gap-x-4">
        <span>{t('Staff.colPerson')}</span>
        <span>{t('Staff.colRole')}</span>
        <span>{t('Staff.colSpots')}</span>
        <span>{t('Staff.colStatus')}</span>
        <span className="text-right">{t('Staff.colActions')}</span>
      </div>
      <ul className="divide-y divide-gray-100 xl:col-span-5 xl:grid xl:grid-cols-subgrid">
        {members.map((m) => {
          const self = m.id === actor.userId;
          const actions = staffMenuActions(actor, m);
          const names = m.spotIds.map((id) => spotNames.get(id)).filter((n): n is string => !!n);
          return (
            <li
              key={m.id}
              className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-subgrid xl:items-center xl:gap-x-4 xl:gap-y-0"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-gray-900">
                  <span className="truncate">{m.name || m.email}</span>
                  {self && <Badge tone="brand">{t('Staff.you')}</Badge>}
                </p>
                <p className="truncate text-xs text-gray-500">{m.email}</p>
                <p className="text-xs text-gray-400">{t('Staff.since', { date: fmtDate(m.createdAt) })}</p>
              </div>
              <div>
                <Badge tone={m.kind === 'BRAND_ADMIN' ? 'purple' : m.kind === 'SPOT_ADMIN' ? 'blue' : 'gray'}>
                  {m.kind ? t(`Roles.${m.kind}`) : m.role}
                </Badge>
              </div>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {m.kind === 'BRAND_ADMIN' ? (
                  <span className="text-xs text-gray-500">{t('Staff.allSpots')}</span>
                ) : names.length === 0 ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  names.map((name) => (
                    <span key={name} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                      {name}
                    </span>
                  ))
                )}
              </div>
              <div>
                <StaffStatusBadge member={m} />
              </div>
              <div className="flex xl:justify-end">
                {actions.length > 0 ? (
                  <StaffRowActions actions={actions} busy={busyId === m.id} onAction={(a) => onAction(m, a)} />
                ) : (
                  <span className="text-xs text-gray-400">{self ? '' : t('Staff.readOnly')}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
