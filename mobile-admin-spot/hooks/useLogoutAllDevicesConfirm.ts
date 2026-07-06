import { useLogoutAllDevices } from "@/hooks/graphql/mutations/useLogoutAllDevices";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useLogoutAllDevicesConfirm = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [logoutAllDevicesMutation] = useLogoutAllDevices();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openConfirm = useCallback(() => {
    setIsConfirmVisible(true);
  }, []);

  const closeConfirm = useCallback(() => {
    if (!isSubmitting) {
      setIsConfirmVisible(false);
    }
  }, [isSubmitting]);

  const confirmLogoutAllDevices = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await logoutAllDevicesMutation();
      if (result.error) {
        Alert.alert(
          t("Common.error"),
          result.error.message || t("Common.error"),
        );
        return;
      }
      if (!result.data?.logoutAllDevices) {
        Alert.alert(t("Common.error"), t("Common.error"));
        return;
      }

      setIsConfirmVisible(false);
      await logout();
      router.replace("/welcome");
    } catch (e) {
      const message = e instanceof Error ? e.message : t("Common.error");
      Alert.alert(t("Common.error"), message);
    } finally {
      setIsSubmitting(false);
    }
  }, [logout, logoutAllDevicesMutation, t]);

  return {
    isConfirmVisible,
    isSubmitting,
    openConfirm,
    closeConfirm,
    confirmLogoutAllDevices,
  };
};
