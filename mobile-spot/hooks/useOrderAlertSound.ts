import { useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';

/**
 * Plays a repeating attention alert while `active` is true.
 * - Web/tablet: a short Web Audio beep every ~1.5s (no bundled asset needed;
 *   the counter is often a loud environment, so this is the primary case).
 * - Native: a repeating vibration pattern.
 *
 * The first web beep may be blocked until the user has interacted with the
 * page (browser autoplay policy) — since staff are actively using the app,
 * a prior tap has almost always unlocked audio by the time an order arrives.
 */
export function useOrderAlertSound(active: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;

    if (Platform.OS === 'web') {
      const beep = () => {
        try {
          const Ctx =
            (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
          if (!Ctx) return;
          if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') void ctx.resume();

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = 880; // A5 — clear, cuts through noise
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.36);
        } catch {
          /* audio unavailable — modal is still shown, so intake isn't blocked */
        }
      };
      beep();
      intervalRef.current = setInterval(beep, 1500);
    } else {
      // Repeat the vibration pattern (last arg true = loop).
      Vibration.vibrate([0, 400, 200, 400], true);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (Platform.OS !== 'web') Vibration.cancel();
    };
  }, [active]);
}
