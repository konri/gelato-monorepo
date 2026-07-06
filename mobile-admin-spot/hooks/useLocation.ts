import { logger } from "@/utils/logger";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import * as Location from "expo-location";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useLocation = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      
      await safeSetItem(
        "locationPermissionGranted",
        granted ? "true" : "false"
      );

      if (granted) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (reverseGeocode.length > 0) {
            const city =
              reverseGeocode[0].city ||
              reverseGeocode[0].subregion ||
              reverseGeocode[0].region;
            if (city) {
              await safeSetItem("selectedCity", city);
            }
          }

          Alert.alert(t("Common.success"), t("Common.locationAccessGranted"));
        } catch (locationError) {
          logger.error("Failed to get location:", locationError);
          Alert.alert(
            t("Common.error"),
            t("Common.locationAccessError") || "Failed to get your location. Please try again or select city manually."
          );
        }
      } else {
        Alert.alert(
          t("Common.info"),
          t("Common.locationAccessDenied") || "Location access denied. You can select city manually."
        );
      }
    } catch (error) {
      logger.error("Location permission error:", error);
      Alert.alert(
        t("Common.error"),
        t("Common.locationPermissionError") || "An error occurred while requesting location permission."
      );
    } finally {
      setIsLoading(false);
      replaceClearingDismissableStack("/notifications");
    }
  };

  const handleLater = async () => {
    await safeSetItem("locationPermissionGranted", "false");
    replaceClearingDismissableStack("/city-select");
  };

  return {
    isLoading,
    handleAllow,
    handleLater,
  };
};
