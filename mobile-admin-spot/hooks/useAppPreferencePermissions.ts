import { logger } from "@/utils/logger";
import * as Linking from "expo-linking";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type AppPermissionSnapshot = {
  camera: string;
  location: string;
  notifications: string;
};

type PermissionStatusResult = {
  status: string;
};

export const useAppPreferencePermissions = () => {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<AppPermissionSnapshot | null>(
    null,
  );

  const refreshPermissions = useCallback(async () => {
    try {
      const [cam, loc, notif] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);
      const grantedLabel = t("AccountHub.permissionGranted");
      const deniedLabel = t("AccountHub.permissionDenied");
      const toLabel = (status: string) =>
        status === "granted" ? grantedLabel : deniedLabel;
      setSnapshot({
        camera: toLabel(cam.status),
        location: toLabel(loc.status),
        notifications: toLabel(notif.status),
      });
    } catch (e) {
      logger.error("refreshPermissions", e);
    }
  }, [t]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch((e) => logger.error("openSettings", e));
  }, []);

  const requestPermissionOrOpenSettings = useCallback(
    async (
      getCurrent: () => Promise<PermissionStatusResult>,
      request: () => Promise<PermissionStatusResult>,
    ) => {
      try {
        const current = await getCurrent();
        if (current.status === "granted") {
          return;
        }
        const requested = await request();
        if (requested.status !== "granted") {
          openSystemSettings();
        }
      } catch (e) {
        logger.error("requestPermissionOrOpenSettings", e);
      } finally {
        await refreshPermissions();
      }
    },
    [openSystemSettings, refreshPermissions],
  );

  const onPressCameraPermission = useCallback(async () => {
    await requestPermissionOrOpenSettings(
      Camera.getCameraPermissionsAsync,
      Camera.requestCameraPermissionsAsync,
    );
  }, [requestPermissionOrOpenSettings]);

  const onPressLocationPermission = useCallback(async () => {
    await requestPermissionOrOpenSettings(
      Location.getForegroundPermissionsAsync,
      Location.requestForegroundPermissionsAsync,
    );
  }, [requestPermissionOrOpenSettings]);

  const onPressNotificationsPermission = useCallback(async () => {
    await requestPermissionOrOpenSettings(
      Notifications.getPermissionsAsync,
      Notifications.requestPermissionsAsync,
    );
  }, [requestPermissionOrOpenSettings]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPermissions();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refreshPermissions]);

  return {
    snapshot,
    refreshPermissions,
    openSystemSettings,
    onPressCameraPermission,
    onPressLocationPermission,
    onPressNotificationsPermission,
  };
};
