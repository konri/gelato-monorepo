import { useCallback, useState } from "react";

type RefreshAction = () => Promise<unknown> | void;

type UsePullToRefreshOptions = {
  enabled?: boolean;
};

type UsePullToRefreshResult = {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
};

export const usePullToRefresh = (
  action: RefreshAction,
  options?: UsePullToRefreshOptions,
): UsePullToRefreshResult => {
  const [refreshing, setRefreshing] = useState(false);
  const enabled = options?.enabled ?? true;

  const onRefresh = useCallback(async () => {
    if (!enabled || refreshing) return;
    setRefreshing(true);
    try {
      await action();
    } finally {
      setRefreshing(false);
    }
  }, [action, enabled, refreshing]);

  return { refreshing, onRefresh };
};
