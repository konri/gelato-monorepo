import { useUpdatePermissions } from "@/hooks/graphql/mutations/useUpdatePermissions";
import { logger } from "@/utils/logger";
import { safeGetItem, safeSetItem } from "@/utils/safeAsyncStorage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useNotifications = () => {
  const { t } = useTranslation();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [updatePermissions, { loading: isUpdatingPermissions }] =
    useUpdatePermissions();

  const isLoading = isRequestingPermission || isUpdatingPermissions;

  const handleAllow = async () => {
    setIsRequestingPermission(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";

      await safeSetItem(
        "notificationPermissionGranted",
        granted ? "true" : "false",
      );

      const locationPermission = await safeGetItem("locationPermissionGranted");
      const selectedCity = await safeGetItem("selectedCity");

      try {
        await updatePermissions({
          variables: {
            location: locationPermission === "true",
            notification: granted,
            city: selectedCity || undefined,
          },
        });
      } catch (updateError) {
        logger.error("Failed to update permissions:", updateError);
        Alert.alert(
          t("Common.error"),
          t("Common.updatePermissionsFailed") ||
            "Failed to update permissions. Please try again.",
        );
      }

      if (granted) {
        Alert.alert(t("Common.success"), t("Common.notificationsEnabled"));
      } else {
        Alert.alert(
          t("Common.info"),
          t("Common.notificationsDenied") ||
            "Notification access denied. You can enable it later in settings.",
        );
      }
    } catch (error) {
      logger.error("Notification permission error:", error);
      Alert.alert(
        t("Common.error"),
        t("Common.notificationPermissionError") ||
          "An error occurred while requesting notification permission.",
      );
    } finally {
      setIsRequestingPermission(false);
      router.replace("/(tabs)");
    }
  };

  const handleLater = async () => {
    await safeSetItem("notificationPermissionGranted", "false");

    const locationPermission = await safeGetItem("locationPermissionGranted");
    const selectedCity = await safeGetItem("selectedCity");

    try {
      await updatePermissions({
        variables: {
          location: locationPermission === "true",
          notification: false,
          city: selectedCity || undefined,
        },
      });
    } catch (error) {
      logger.error("Failed to update permissions:", error);
    }

    router.replace("/(tabs)");
  };

  return {
    isLoading,
    handleAllow,
    handleLater,
  };
};
