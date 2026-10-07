import { canManageStaff, type StaffActor } from '../../auth/scope';
import type { StaffMember } from '../../graphql/staff';

/** Row actions of the staff table, in menu order. */
export type StaffMenuAction =
  | 'changeSpots'
  | 'makeEmployee'
  | 'move'
  | 'makeSpotAdmin'
  | 'resend'
  | 'reset'
  | 'disable'
  | 'enable'
  | 'remove';

/** Actions that open the spot picker. */
export type SpotChangeMode = Extract<StaffMenuAction, 'changeSpots' | 'makeEmployee' | 'move' | 'makeSpotAdmin'>;

/**
 * What the caller may do with a member, mirroring the server's
 * assertCanManageStaff (via canManageStaff); the server stays authoritative.
 * Kind changes exist only between spot admin and employee.
 */
export function staffMenuActions(actor: StaffActor, member: StaffMember): StaffMenuAction[] {
  const target = { id: member.id, kind: member.kind ?? null, brandId: member.brandId, spotIds: member.spotIds };
  const out: StaffMenuAction[] = [];
  if (member.kind === 'SPOT_ADMIN') {
    if (canManageStaff(actor, target, 'ASSIGN_SPOTS')) out.push('changeSpots');
    if (canManageStaff(actor, target, 'CHANGE_KIND')) out.push('makeEmployee');
  }
  if (member.kind === 'EMPLOYEE') {
    if (canManageStaff(actor, target, 'MOVE')) out.push('move');
    if (canManageStaff(actor, target, 'CHANGE_KIND')) out.push('makeSpotAdmin');
  }
  if (member.invitePending) {
    if (canManageStaff(actor, target, 'RESEND_INVITE')) out.push('resend');
  } else if (canManageStaff(actor, target, 'RESET_PASSWORD')) {
    out.push('reset');
  }
  if (canManageStaff(actor, target, 'DISABLE')) out.push(member.loginDisabled ? 'enable' : 'disable');
  if (canManageStaff(actor, target, 'REMOVE')) out.push('remove');
  return out;
}

export function isSpotChange(action: StaffMenuAction): action is SpotChangeMode {
  return action === 'changeSpots' || action === 'makeEmployee' || action === 'move' || action === 'makeSpotAdmin';
}
