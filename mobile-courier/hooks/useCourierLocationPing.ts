import { updateCourierLocation } from '@repo/api-client';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

const PING_INTERVAL_MS = 60_000; // battery-friendly: one fix per minute

/**
 * While the courier has an active delivery, push a fresh GPS fix to the backend
 * every ~60s (so the spot + client see the live tick on the map). Uses a single
 * balanced-accuracy fix per interval rather than a continuous watch to save
 * battery. No-op when orderId is null.
 */
export const useCourierLocationPing = (orderId: string | null) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    const sendPing = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        await updateCourierLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy ?? undefined,
          orderId,
        );
      } catch {
        // Transient GPS/network failure — the next tick will retry.
      }
    };

    // Send one immediately, then on the interval.
    void sendPing();
    timerRef.current = setInterval(sendPing, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [orderId]);
};
