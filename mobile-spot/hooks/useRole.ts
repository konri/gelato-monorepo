import { atLeast, capabilitiesFor, type AccessLevel, type Capabilities } from '@/auth/levels';
import { useSession } from '@/contexts/SessionProvider';
import type { StaffKindVM } from '@/shared/api-client/src/api/types';
import { useMemo } from 'react';
import { useSpotState } from './useActiveSpot';

export type SpotRoleInfo = {
  roles: string[];
  userId: string | null;
  /** The active spot (reactive; null until one is selected). */
  spotId: string | null;
  /** The caller's level at the active spot. */
  level: AccessLevel | null;
  staffKind: StaffKindVM | null;
  /** MANAGE_SPOT or higher at the active spot (spot admin, brand admin, Loodly team). */
  isAdmin: boolean;
  /** MANAGE_BRAND or higher at the active spot. */
  isBrandAdmin: boolean;
  isPlatform: boolean;
  /** OPERATE only at the active spot. */
  isEmployee: boolean;
  can: Capabilities;
  loading: boolean;
};

/**
 * The staff member's role at the ACTIVE spot (BRANDS_SPEC §4.5). The level
 * comes from the spot context (myStaffContext / login), never from the global
 * roles, and follows every spot switch.
 */
export function useRole(): SpotRoleInfo {
  const session = useSession();
  const spot = useSpotState();
  return useMemo(() => {
    const spotId = spot.status === 'ready' ? spot.activeSpotId : null;
    const level = spotId ? spot.spots.find((s) => s.spotId === spotId)?.level ?? null : null;
    return {
      roles: Array.isArray(session.user?.roles) ? (session.user?.roles as string[]) : [],
      userId: session.userId ?? spot.userId,
      spotId,
      level,
      staffKind: spot.staffKind,
      isAdmin: atLeast(level, 'MANAGE_SPOT'),
      isBrandAdmin: atLeast(level, 'MANAGE_BRAND'),
      isPlatform: level === 'PLATFORM',
      isEmployee: level === 'OPERATE',
      can: capabilitiesFor(level),
      loading: session.status === 'loading' || spot.status === 'idle' || spot.status === 'loading',
    };
  }, [session.user, session.userId, session.status, spot]);
}
