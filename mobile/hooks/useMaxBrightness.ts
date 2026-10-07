import * as Brightness from 'expo-brightness';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

/**
 * Full screen brightness while `active` (scanners read a bright screen better),
 * restored on deactivation, when the app goes to the background and on
 * unmount (BRANDS_SPEC §5.4).
 *
 * iOS changes the SYSTEM brightness until the device locks, so restoring is
 * mandatory there; Android only overrides the current window.
 */
export function useMaxBrightness(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let previous: number | null = null;
    let boosted = false;
    // Boost / restore run one after another, so a restore can never be
    // overtaken by a slower boost (which would leave the screen at 100 %).
    let chain: Promise<void> = Promise.resolve();
    const enqueue = (step: () => Promise<void>) => {
      chain = chain.then(step).catch(() => {
        /* not fatal: the code still shows */
      });
    };

    const boost = () =>
      enqueue(async () => {
        if (boosted) return;
        if (!(await Brightness.isAvailableAsync())) return;
        previous = await Brightness.getBrightnessAsync();
        boosted = true;
        await Brightness.setBrightnessAsync(1);
      });

    const restore = () =>
      enqueue(async () => {
        if (!boosted) return;
        boosted = false;
        if (Platform.OS === 'android') {
          await Brightness.restoreSystemBrightnessAsync();
        } else if (previous != null) {
          await Brightness.setBrightnessAsync(previous);
        }
      });

    boost();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') boost();
      else restore();
    });

    return () => {
      sub.remove();
      restore();
    };
  }, [active]);
}
