import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { AccountYourAccountCardProps } from "./types";

export const AccountYourAccountCard = ({
  givenName,
  handleLabel,
  pictureUri,
  onPressEdit,
}: AccountYourAccountCardProps) => {
  const { t } = useTranslation();

  const resolvedPicture = pictureUri?.trim() || null;

  const initials = useMemo(() => {
    const parts = givenName.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
    const pair = `${a}${b}`.toUpperCase();
    return pair || "?";
  }, [givenName]);

  return (
    <View className="items-center">
      <View className="relative mb-4">
        <View
          className="w-24 h-24 rounded-full border-4 border-indigo-100 overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {resolvedPicture ? (
            <Image
              source={{ uri: resolvedPicture }}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              fallbackLogoSize={48}
            />
          ) : (
            <View className="w-full h-full bg-azure-deep items-center justify-center">
              <Typography variant="text-24-bold" className="text-white">
                {initials}
              </Typography>
            </View>
          )}
        </View>
        <Pressable
          onPress={onPressEdit}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-navy items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name="camera" size={11} color="#FFFFFF" />
        </Pressable>
      </View>

      <Typography variant="text-24-bold" className="text-dark text-center">
        {givenName}
      </Typography>
      {handleLabel ? (
        <Typography
          variant="text-14-semibold"
          className="text-cool-gray text-center"
        >
          {handleLabel}
        </Typography>
      ) : null}

      <Pressable
        onPress={onPressEdit}
        className="mt-4 flex-row items-center bg-white rounded-2xl px-3 py-2 gap-2.5"
      >
        <Typography variant="text-14-bold" className="text-dark">
          {t("AccountHub.editPersonalData")}
        </Typography>
        <Ionicons name="chevron-forward" size={11} color="#131B2E" />
      </Pressable>
    </View>
  );
};
