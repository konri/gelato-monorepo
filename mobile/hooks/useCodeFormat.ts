import { CODE_FORMAT_KEY } from '@/utils/loyaltyStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * QR | Barcode preference (BRANDS_SPEC §5.4), per device, shared live by My
 * card, the fullscreen card and the reward code. Default: QR.
 */
export type CodeFormat = 'qr' | 'barcode';

let current: CodeFormat = 'qr';
let loaded = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const load = async () => {
  if (loaded) return;
  loaded = true;
  try {
    const stored = await AsyncStorage.getItem(CODE_FORMAT_KEY);
    if (stored === 'qr' || stored === 'barcode') {
      if (stored !== current) {
        current = stored;
        notify();
      }
    }
  } catch {
    /* default stays */
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => current;

export function useCodeFormat(): [CodeFormat, (next: CodeFormat) => void] {
  const format = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void load();
  }, []);

  const setFormat = useCallback((next: CodeFormat) => {
    if (next === current) return;
    current = next;
    loaded = true;
    notify();
    AsyncStorage.setItem(CODE_FORMAT_KEY, next).catch(() => {
      /* best effort */
    });
  }, []);

  return [format, setFormat];
}
