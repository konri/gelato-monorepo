import type { AdminUser, StaffKind } from '../lib/authApi';

/** The console's view of the caller (BRANDS_SPEC §1.3, §3.1). */
export type Scope = 'PLATFORM' | 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE' | 'NONE';

export function scopeFromUser(user: AdminUser | null | undefined): Scope {
  if (!user) return 'NONE';
  return user.staffKind;
}

/** Where a scope lands after login (and for unknown paths). */
export function homeFor(scope: Scope): string {
  switch (scope) {
    case 'PLATFORM':
      return '/brands';
    case 'BRAND_ADMIN':
      return '/brand';
    case 'SPOT_ADMIN':
    case 'EMPLOYEE':
      return '/use-spot-app';
    default:
      return '/login';
  }
}

/** Mirrors the backend's STAFF_RANK. */
export const STAFF_RANK: Record<'PLATFORM' | StaffKind, number> = {
  PLATFORM: 4,
  BRAND_ADMIN: 3,
  SPOT_ADMIN: 2,
  EMPLOYEE: 1,
};

export type StaffAction =
  | 'VIEW'
  | 'RESEND_INVITE'
  | 'RESET_PASSWORD'
  | 'DISABLE'
  | 'ASSIGN_SPOTS'
  | 'MOVE'
  | 'CHANGE_KIND'
  | 'REMOVE';

export type StaffActor = {
  userId: string;
  scope: Scope;
  /** null for PLATFORM. */
  brandId: string | null;
  /** Spot admins: their spots. */
  spotIds?: readonly string[];
};

export type StaffTargetRef = {
  id: string;
  /** null = no membership; 'PLATFORM' = a super admin. */
  kind: 'PLATFORM' | StaffKind | null | undefined;
  brandId?: string | null;
  spotIds?: readonly string[];
};

/**
 * Client mirror of access.ts assertCanManageStaff, for hiding actions the
 * server would refuse (the server stays authoritative):
 * - nobody acts on themselves (VIEW only);
 * - PLATFORM may act on anyone else;
 * - otherwise: same brand, the target has a membership, the caller strictly
 *   outranks it; ASSIGN_SPOTS / CHANGE_KIND need a brand admin; a spot admin
 *   only manages employees of its own spots.
 */
export function canManageStaff(actor: StaffActor, target: StaffTargetRef, action: StaffAction): boolean {
  if (target.id === actor.userId) return action === 'VIEW';
  if (actor.scope === 'PLATFORM') return true;
  if (actor.scope === 'NONE' || actor.scope === 'EMPLOYEE') return false;
  const kind = target.kind;
  if (!kind || kind === 'PLATFORM' || !target.brandId || target.brandId !== actor.brandId) return false;
  if (STAFF_RANK[actor.scope] <= STAFF_RANK[kind]) return false;
  if ((action === 'ASSIGN_SPOTS' || action === 'CHANGE_KIND') && actor.scope !== 'BRAND_ADMIN') return false;
  if (actor.scope === 'SPOT_ADMIN') {
    const mine = new Set(actor.spotIds ?? []);
    const theirs = target.spotIds ?? [];
    if (theirs.length === 0 || !theirs.every((id) => mine.has(id))) return false;
  }
  return true;
}
