import type { StaffKindVM } from '@/shared/api-client/src/api/types';
import type { BrandStaffMember, StaffKind } from '@/shared/api-client/src/graphql/queries/brandStaff/types';
import type { AccessLevel } from './levels';

/**
 * Client mirror of the server's staff rules (BRANDS_SPEC §1.4, §4.7;
 * backend access.ts assertCanCreateStaff / assertCanManageStaff). UX only:
 * the app hides what the server would refuse; the server decides.
 *
 * - Ranks: Loodly team > brand admin > spot admin > employee. The caller must
 *   strictly outrank the member; nobody acts on themselves.
 * - A spot admin creates and manages employees of their own spots only.
 * - Brand admins (and the Loodly team) also create spot admins, assign their
 *   spots and change a member's kind.
 */

export type StaffCaller = {
  userId: string | null;
  staffKind: StaffKindVM | null;
  /** Level at the active spot. */
  level: AccessLevel | null;
  /** Spots the caller manages (MANAGE_SPOT or higher). */
  managedSpotIds: ReadonlySet<string>;
};

const RANK: Record<StaffKind, number> = { EMPLOYEE: 1, SPOT_ADMIN: 2, BRAND_ADMIN: 3 };

const isPlatform = (c: StaffCaller) => c.staffKind === 'PLATFORM' || c.level === 'PLATFORM';
const isBrandAdmin = (c: StaffCaller) => c.staffKind === 'BRAND_ADMIN';

/** Kinds the caller may invite in the spot app. */
export function creatableKinds(caller: StaffCaller): StaffKind[] {
  if (isPlatform(caller) || isBrandAdmin(caller)) return ['EMPLOYEE', 'SPOT_ADMIN'];
  if (caller.staffKind === 'SPOT_ADMIN') return ['EMPLOYEE'];
  return [];
}

/** Reset password, resend the invite, block sign-in, move (employees), remove. */
export function canManageMember(caller: StaffCaller, member: BrandStaffMember): boolean {
  if (!member.kind || member.id === caller.userId) return false;
  if (isPlatform(caller)) return true;
  const own = caller.staffKind;
  if (own !== 'BRAND_ADMIN' && own !== 'SPOT_ADMIN') return false;
  if (RANK[own] <= RANK[member.kind]) return false;
  if (own === 'SPOT_ADMIN') {
    return member.spotIds.length > 0 && member.spotIds.every((id) => caller.managedSpotIds.has(id));
  }
  return true;
}

/** Assign a spot admin's spots, or change a member's kind (brand admin / Loodly team). */
export function canAssignSpots(caller: StaffCaller, member: BrandStaffMember): boolean {
  return canManageMember(caller, member) && (isPlatform(caller) || isBrandAdmin(caller));
}
