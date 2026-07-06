import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

type RefetchFn = () => unknown | Promise<unknown>;

export const useLoyaltyListRefetchOnFocus = (
  refetchPrimary: RefetchFn,
  options?: { refetchSecondary?: RefetchFn; secondaryWhen?: boolean; enabled?: boolean },
) => {
  const { refetchSecondary, secondaryWhen = false, enabled = true } = options ?? {};
  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }
      void Promise.resolve(refetchPrimary());
      if (secondaryWhen && refetchSecondary) {
        void Promise.resolve(refetchSecondary());
      }
    }, [enabled, refetchPrimary, refetchSecondary, secondaryWhen]),
  );
};
