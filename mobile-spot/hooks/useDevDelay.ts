import { useEffect, useState } from 'react';

const DEV_DELAY_MS = 1000;

/** W trybie DEV zwraca true przez DEV_DELAY_MS ms, potem false. Produkcja zawsze false. */
export function useDevDelay(): boolean {
  const [active, setActive] = useState(__DEV__);

  useEffect(() => {
    if (!__DEV__) return;
    const t = setTimeout(() => setActive(false), DEV_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return active;
}
