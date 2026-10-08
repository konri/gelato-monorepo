import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PagerView from "react-native-pager-view";

/** Which illustration a slide shows (see app/onboarding/index.tsx). */
export type OnboardingArt = "treats" | "scan" | "rewards" | "couriers";

export type OnboardingSlide = {
  art: OnboardingArt;
  title: string;
  description: string;
};

export const useOnboarding = ({ reduceMotion = false }: { reduceMotion?: boolean } = {}) => {
  const { t } = useTranslation();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const leavingRef = useRef(false);

  const slides: OnboardingSlide[] = [
    {
      art: "treats",
      title: t("Onboarding.slide1.title"),
      description: t("Onboarding.slide1.description"),
    },
    {
      art: "scan",
      title: t("Onboarding.slide2.title"),
      description: t("Onboarding.slide2.description"),
    },
    {
      art: "rewards",
      title: t("Onboarding.slide3.title"),
      description: t("Onboarding.slide3.description"),
    },
    {
      art: "couriers",
      title: t("Onboarding.slide4.title"),
      description: t("Onboarding.slide4.description"),
    },
  ];
  const lastPage = slides.length - 1;
  const isLastPage = currentPage >= lastPage;

  // Remember that onboarding was seen, then go to sign in / sign up. Guarded,
  // so a double tap doesn't replace the route twice; a storage failure only
  // means onboarding shows again next launch.
  const completeOnboarding = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
    } catch {
      // ignore — see above
    }
    router.replace("/welcome");
  };

  const nextPage = async () => {
    if (currentPage < lastPage) {
      const next = currentPage + 1;
      if (reduceMotion) pagerRef.current?.setPageWithoutAnimation(next);
      else pagerRef.current?.setPage(next);
    } else {
      await completeOnboarding();
    }
  };

  const skipOnboarding = completeOnboarding;

  return {
    pagerRef,
    currentPage,
    setCurrentPage,
    slides,
    isLastPage,
    nextPage,
    skipOnboarding,
  };
};
