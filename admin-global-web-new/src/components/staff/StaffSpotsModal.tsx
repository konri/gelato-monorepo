import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  CHANGE_STAFF_KIND,
  MOVE_EMPLOYEE,
  SET_SPOT_ADMIN_SPOTS,
  type StaffMember,
} from '../../graphql/staff';
import type { AdminSpot } from '../../graphql/spots';
import { evictRoot } from '../../lib/cachePolicies';
import { errorText } from '../../lib/errors';
import { SpotChecklist } from '../SpotChecklist';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { SpotChangeMode } from './staffActions';

const MULTIPLE: Record<SpotChangeMode, boolean> = {
  changeSpots: true,
  makeSpotAdmin: true,
  move: false,
  makeEmployee: false,
};

function initialSpots(member: StaffMember, mode: SpotChangeMode): string[] {
  if (mode === 'makeEmployee') return member.spotIds.length === 1 ? [...member.spotIds] : [];
  return [...member.spotIds];
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * Spots of a staff member: change a spot admin's spots, move an employee,
 * or switch between spot admin (one or more spots) and employee (one spot).
 * Moving and changing the role sign the person out (the server ends their
 * sessions); changing a spot admin's spots does not.
 */
export function StaffSpotsModal({
  member,
  mode,
  spots,
  onClose,
  onDone,
}: {
  member: StaffMember;
  mode: SpotChangeMode;
  spots: AdminSpot[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [spotIds, setSpotIds] = useState<string[]>(() => initialSpots(member, mode));
  const [error, setError] = useState<string | null>(null);
  const evict = { update: (cache: Parameters<typeof evictRoot>[0]) => evictRoot(cache, ['brandStaff']) };
  const [setSpots, { loading: l1 }] = useMutation(SET_SPOT_ADMIN_SPOTS, evict);
  const [move, { loading: l2 }] = useMutation(MOVE_EMPLOYEE, evict);
  const [changeKind, { loading: l3 }] = useMutation(CHANGE_STAFF_KIND, evict);
  const busy = l1 || l2 || l3;
  const who = member.name || member.email;

  const multiple = MULTIPLE[mode];
  const valid = multiple ? spotIds.length > 0 : spotIds.length === 1;
  const unchanged = (mode === 'changeSpots' || mode === 'move') && sameSet(spotIds, member.spotIds);

  const submit = async () => {
    setError(null);
    try {
      if (mode === 'changeSpots') {
        await setSpots({ variables: { userId: member.id, spotIds } });
        onDone(t('Staff.spotsSaved', { name: who }));
      } else if (mode === 'move') {
        await move({ variables: { userId: member.id, spotId: spotIds[0] } });
        onDone(t('Staff.movedNotice', { name: who }));
      } else {
        const kind = mode === 'makeSpotAdmin' ? 'SPOT_ADMIN' : 'EMPLOYEE';
        await changeKind({ variables: { userId: member.id, kind, spotIds } });
        onDone(t('Staff.kindChangedNotice', { name: who, role: t(`Roles.${kind}`) }));
      }
      onClose();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <ConfirmDialog
      title={t(`Staff.spotsTitle_${mode}`, { name: who })}
      confirmLabel={t(`Staff.spotsConfirm_${mode}`)}
      busy={busy}
      error={error}
      confirmDisabled={!valid || unchanged}
      onCancel={onClose}
      onConfirm={() => void submit()}
    >
      <p className="mb-3 text-sm text-gray-600">{t(`Staff.spotsBody_${mode}`)}</p>
      <SpotChecklist
        spots={spots}
        value={spotIds}
        onChange={setSpotIds}
        multiple={multiple}
        disabled={busy}
        name={`staff-spot-${member.id}`}
      />
      {mode !== 'changeSpots' && <p className="mt-3 text-xs text-amber-700">{t('Staff.signOutNote')}</p>}
    </ConfirmDialog>
  );
}
