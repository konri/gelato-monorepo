import * as ExpoImagePicker from "expo-image-picker";
import { logger } from "@/utils/logger";

export async function pickImageFromLibrary(): Promise<string | null> {
  try {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      logger.error("Permission to access media library was denied");
      return null;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    logger.error("Error picking image:", error);
    return null;
  }
}
