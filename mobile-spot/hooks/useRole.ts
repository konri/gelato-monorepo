import { useEffect, useState } from 'react';
import { getStoredSpotContext } from './useSpotOrders';

export type SpotRoleInfo = {
  roles: string[];
  spotId: string | null;
  userId: string | null;
  /** SPOT_ADMIN (or a global admin) — can manage products, spot, dashboards. */
  isAdmin: boolean;
  /** EMPLOYEE with no admin role — restricted to operational screens. */
  isEmployee: boolean;
  loading: boolean;
};

const ADMIN_ROLES = ['SPOT_ADMIN', 'SPOTS_ADMIN', 'SUPER_ADMIN'];

/**
 * The logged-in staff member's role in the spot app, read from the stored
 * spot context. Drives Admin-vs-Employee gating across the UI.
 */
export function useRole(): SpotRoleInfo {
  const [state, setState] = useState<Omit<SpotRoleInfo, 'loading'>>({
    roles: [],
    spotId: null,
    userId: null,
    isAdmin: false,
    isEmployee: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStoredSpotContext()
      .then((ctx) => {
        if (cancelled) return;
        const roles = ctx.roles ?? [];
        const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
        setState({
          roles,
          spotId: ctx.spotId,
          userId: ctx.userId,
          isAdmin,
          isEmployee: !isAdmin && roles.includes('EMPLOYEE'),
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, loading };
}
