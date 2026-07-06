import { logger } from "@/utils/logger";
import * as Linking from "expo-linking";
import { useEffect } from "react";

type DeepLinkHandler = (path: string, params: Record<string, string | string[]>) => void;

type UseDeepLinkOptions = {
  handleInitialUrl?: boolean;
};

const normalizeQueryParams = (
  queryParams: Linking.QueryParams | null | undefined,
): Record<string, string | string[]> => {
  if (!queryParams) {
    return {};
  }

  return Object.entries(queryParams).reduce<Record<string, string | string[]>>(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
};

export const useDeepLink = (
  onDeepLink: DeepLinkHandler,
  options: UseDeepLinkOptions = { handleInitialUrl: true },
) => {
  useEffect(() => {
    if (options.handleInitialUrl) {
      const handleInitialURL = async () => {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          logger.log("App opened with deep link:", initialUrl);
          const { path, queryParams } = Linking.parse(initialUrl);
          if (path && queryParams) {
            onDeepLink(path, normalizeQueryParams(queryParams));
          }
        }
      };

      handleInitialURL();
    }

    const subscription = Linking.addEventListener("url", (event) => {
      logger.log("Deep link received:", event.url);
      const { path, queryParams } = Linking.parse(event.url);
      if (path && queryParams) {
        onDeepLink(path, normalizeQueryParams(queryParams));
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onDeepLink, options.handleInitialUrl]);
};
