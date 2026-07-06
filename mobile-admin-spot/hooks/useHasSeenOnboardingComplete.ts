import { safeGetItem, safeSetItem } from "@/utils/safeAsyncStorage";
import { useEffect, useState } from "react";

const HAS_SEEN_ONBOARDING_COMPLETE_KEY = "hasSeenOnboardingComplete";

export const useHasSeenOnboardingComplete = (isComplete: boolean) => {
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHasSeen = async () => {
      if (!isComplete) {
        setHasSeen(false);
        setIsLoading(false);
        return;
      }

      const value = await safeGetItem(HAS_SEEN_ONBOARDING_COMPLETE_KEY);
      const hasSeenValue = value === "true";
      setHasSeen(hasSeenValue);
      setIsLoading(false);
    };

    checkHasSeen();
  }, [isComplete]);

  const markAsSeen = async () => {
    await safeSetItem(HAS_SEEN_ONBOARDING_COMPLETE_KEY, "true");
    setHasSeen(true);
  };

  return {
    hasSeen: hasSeen ?? false,
    isLoading,
    markAsSeen,
  };
};
