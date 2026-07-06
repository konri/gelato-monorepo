import { OrderDetail, OrderListEntry, getMyOrders, getOrderById } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useMyOrders = () => useGraphQLQuery<OrderListEntry[]>(getMyOrders, {}, []);

// Statuses where the order is still moving — worth polling for live updates.
const ACTIVE_STATUSES = new Set([
  'PENDING',
  'PREPARING',
  'READY',
  'COURIER_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
]);

/**
 * Order detail with polling. While the order is active it refetches every
 * `intervalMs` (default 8s) so the status + courier pin stay fresh; polling
 * stops automatically once the order reaches a terminal status.
 */
export const useOrderTracking = (id: string | null, intervalMs = 8000) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!id) return;
    const token = await safeGetItem('access_token');
    const res = await getOrderById(id, { token: token ?? undefined });
    if (res.success) {
      setOrder(res.data);
      setError(null);
    } else {
      setError(res.error?.message ?? 'Failed to load order');
    }
    setLoading(false);
    return res.data;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const tick = async () => {
      const data = await fetchOnce();
      if (cancelled) return;
      // Stop polling once terminal.
      if (data && !ACTIVE_STATUSES.has(data.status) && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    tick();
    timer.current = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchOnce, intervalMs]);

  return { order, loading, error, refetch: fetchOnce };
};
