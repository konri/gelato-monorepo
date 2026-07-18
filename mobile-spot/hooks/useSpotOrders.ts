import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  claimOrder as claimOrderApi,
  getSpotOrders,
  updateOrderStatus as updateOrderStatusApi,
  type SpotOrder,
} from '@repo/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';

const SPOT_CTX_KEY = 'spotContext';

// Persist the staff member's spot id + identity at login (the whoami sync can
// overwrite userData without these fields, so we keep our own copy).
export async function storeSpotContext(ctx: {
  spotId: string | null;
  userId: string | null;
  roles: string[];
}) {
  await AsyncStorage.setItem(SPOT_CTX_KEY, JSON.stringify(ctx));
}

// The logged-in staff member's spot id + identity.
export async function getStoredSpotContext(): Promise<{
  spotId: string | null;
  userId: string | null;
  roles: string[];
}> {
  try {
    const raw = await AsyncStorage.getItem(SPOT_CTX_KEY);
    if (raw) return JSON.parse(raw);
    // Fallback: userData (in case ctx wasn't stored).
    const ud = await AsyncStorage.getItem('userData');
    const u = ud ? JSON.parse(ud) : null;
    return { spotId: u?.spotId ?? null, userId: u?.id ?? null, roles: u?.roles ?? [] };
  } catch {
    return { spotId: null, userId: null, roles: [] };
  }
}

// Fetch spot orders for a given status filter (null = all).
// `pollMs` adds a polling fallback (default 30s) so the queue stays fresh even
// if the websocket subscription drops — set to 0 to disable.
export function useSpotOrders(status: string | null, pollMs = 30000) {
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotId, setSpotId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    setSpotId(ctx.spotId);
    if (!ctx.spotId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const token = await AsyncStorage.getItem('access_token');
    const res = await getSpotOrders(ctx.spotId, status, { token: token || undefined });
    setOrders(res.data ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  // Polling fallback — refetch every `pollMs` while mounted.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => void loadRef.current(), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return { orders, loading, spotId, refetch: load, setOrders };
}

export async function claimOrder(orderId: string) {
  const token = await AsyncStorage.getItem('access_token');
  return claimOrderApi(orderId, { token: token || undefined });
}

export async function advanceOrderStatus(orderId: string, status: string) {
  const token = await AsyncStorage.getItem('access_token');
  return updateOrderStatusApi(orderId, status, { token: token || undefined });
}
