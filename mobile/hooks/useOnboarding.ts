import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PagerView from "react-native-pager-view";

export const useOnboarding = () => {
  const { t } = useTranslation();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const slides = [
    {
      title: t("Onboarding.slide1.title"),
      description: t("Onboarding.slide1.description"),
    },
    {
      title: t("Onboarding.slide2.title"),
      description: t("Onboarding.slide2.description"),
    },
    {
      title: t("Onboarding.slide3.title"),
      description: t("Onboarding.slide3.description"),
    },
  ];

  const nextPage = async () => {
    if (currentPage < 2) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/welcome");
    }
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/welcome");
  };

  return {
    pagerRef,
    currentPage,
    setCurrentPage,
    slides,
    nextPage,
    skipOnboarding,
  };
};
