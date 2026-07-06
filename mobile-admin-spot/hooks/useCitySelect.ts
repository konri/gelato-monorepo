import { safeSetItem } from "@/utils/safeAsyncStorage";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useCitySelect = () => {
  const { t } = useTranslation();
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!city) {
      Alert.alert(t("Common.error"), t("Common.selectCity"));
      return;
    }

    setIsLoading(true);
    await safeSetItem("selectedCity", city);
    Alert.alert(t("Common.success"), `${t("Common.citySelected")}: ${city}`);
    setIsLoading(false);
    router.push("/notifications");
  };

  return {
    city,
    setCity,
    isLoading,
    handleConfirm,
  };
};
