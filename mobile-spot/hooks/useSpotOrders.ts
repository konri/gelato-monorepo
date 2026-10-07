import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  claimOrder as claimOrderApi,
  getSpotOrders,
  getSpotAttentionOrders,
  redispatchOrder as redispatchOrderApi,
  terminateOrder as terminateOrderApi,
  updateOrderStatus as updateOrderStatusApi,
  type SpotOrder,
} from '@repo/api-client';
import { useActiveSpotId } from '@/hooks/useActiveSpot';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { spotStore } from '@/stores/spotStore';
import { useCallback, useEffect, useRef, useState } from 'react';

// Fetch the ACTIVE spot's orders for a given status filter (null = all).
// `pollMs` adds a polling fallback (default 30s) so the queue stays fresh even
// if the websocket subscription drops — set to 0 to disable.
export function useSpotOrders(status: string | null, pollMs = 30000) {
  const spotId = useActiveSpotId();
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // A different spot: drop the previous spot's list right away.
  useEffect(() => {
    setOrders([]);
    setLoading(true);
  }, [spotId]);

  const load = useCallback(async () => {
    if (!spotId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const token = await AsyncStorage.getItem('access_token');
    const res = await getSpotOrders(spotId, status, { token: token || undefined });
    // Stale guard: the spot changed while the request was in flight.
    if (spotStore.getActiveSpotId() !== spotId) return;
    setOrders(res.data ?? []);
    setLoading(false);
  }, [status, spotId]);

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

// Orders needing spot attention in the last 24h (terminated / cancelled /
// incident-held) — the "Needs attention" section on the Prepared tab.
export function useSpotAttentionOrders(pollMs = 30000) {
  const spotId = useActiveSpotId();
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrders([]);
    setLoading(true);
  }, [spotId]);

  const load = useCallback(async () => {
    if (!spotId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const token = await AsyncStorage.getItem('access_token');
    const res = await getSpotAttentionOrders(spotId, { token: token || undefined });
    if (spotStore.getActiveSpotId() !== spotId) return;
    setOrders(res.data ?? []);
    setLoading(false);
  }, [spotId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => void loadRef.current(), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  // A courier incident / foreground push (refreshEmitter) → refetch now.
  useEffect(() => refreshEmitter.subscribe(() => void loadRef.current()), []);

  return { orders, loading, refetch: load };
}

export async function claimOrder(orderId: string) {
  const token = await AsyncStorage.getItem('access_token');
  return claimOrderApi(orderId, { token: token || undefined });
}

export async function redispatchOrder(orderId: string) {
  const token = await AsyncStorage.getItem('access_token');
  return redispatchOrderApi(orderId, { token: token || undefined });
}

export async function terminateOrder(orderId: string, reason?: string, apologyPoints?: number) {
  const token = await AsyncStorage.getItem('access_token');
  return terminateOrderApi(orderId, reason, { token: token || undefined }, apologyPoints);
}

export async function advanceOrderStatus(orderId: string, status: string) {
  const token = await AsyncStorage.getItem('access_token');
  return updateOrderStatusApi(orderId, status, { token: token || undefined });
}
