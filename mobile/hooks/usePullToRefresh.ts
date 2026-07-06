import { useCallback, useState } from 'react';
import { refreshEmitter } from './useRefreshEmitter';

const MIN_REFRESH_MS = 600;

export const usePullToRefresh = (onRefreshFn?: () => Promise<void> | void) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 100));
    const start = Date.now();
    if (onRefreshFn) {
      try {
        await onRefreshFn();
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_REFRESH_MS - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        setRefreshing(false);
      }
    } else {
      refreshEmitter.emit();
      setTimeout(() => setRefreshing(false), MIN_REFRESH_MS);
    }
  }, [onRefreshFn]);

  return { refreshing, onRefresh };
};
