import type { TabsNavigationConfig } from "@/components/organisms/StandardTabsLayout/types";
import {
  DEFAULT_TABS_CONFIG,
  MOCK_TABS_NAVIGATION_CONFIG,
} from "@/mocks/tabsNavigationConfig";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseTabsConfigResult = {
  config: TabsNavigationConfig;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export const useTabsConfig = (enabled = true): UseTabsConfigResult => {
  const [remoteConfig, setRemoteConfig] =
    useState<TabsNavigationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchConfig = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const sortedTabs = [...MOCK_TABS_NAVIGATION_CONFIG.tabs].sort(
        (a, b) => a.order - b.order
      );

      setRemoteConfig({ tabs: sortedTabs });
      hasFetched.current = true;
    } catch {
      setError("Failed to fetch tabs configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !hasFetched.current) {
      fetchConfig();
    }
  }, [enabled, fetchConfig]);

  const config = useMemo(
    () => remoteConfig ?? DEFAULT_TABS_CONFIG,
    [remoteConfig]
  );

  return { config, isLoading, error, refetch: fetchConfig };
};
