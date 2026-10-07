/**
 * Loyalty-wide app events that are not tied to a screen (BRANDS_SPEC §5.2).
 *
 *   cityChanged — the user picked another city (Settings / city-select); the
 *                 BrandProvider refetches the overview for the new city.
 */

type Listener = () => void;

const cityListeners = new Set<Listener>();

export const onCityChanged = (listener: Listener): (() => void) => {
  cityListeners.add(listener);
  return () => cityListeners.delete(listener);
};

export const emitCityChanged = (): void => {
  cityListeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore */
    }
  });
};
