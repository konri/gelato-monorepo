import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { SupportSectionContentProps } from "./types";

const supportActionTileClassName =
  "flex-1 bg-white rounded-3xl shadow-settings-card items-center py-5 gap-3";

export const SupportSectionContent = ({
  onHelpCenter,
  onContact,
  version,
}: SupportSectionContentProps) => {
  const { t } = useTranslation();

  return (
    <View className="gap-4">
      <View className="flex-row gap-5">
        <Pressable onPress={onHelpCenter} className={supportActionTileClassName}>
          <View className="w-12 h-12 rounded-full bg-navy-5 items-center justify-center">
            <Ionicons name="help-circle-outline" size={20} color="#00387E" />
          </View>
          <Typography variant="text-12-bold" className="text-dark text-center">
            {t("AccountHub.helpCenter")}
          </Typography>
        </Pressable>
        <Pressable onPress={onContact} className={supportActionTileClassName}>
          <View className="w-12 h-12 rounded-full bg-navy-5 items-center justify-center">
            <Ionicons name="mail-outline" size={20} color="#00387E" />
          </View>
          <Typography variant="text-12-bold" className="text-dark text-center">
            {t("AccountHub.contact")}
          </Typography>
        </Pressable>
      </View>

      <View className="bg-white rounded-3xl shadow-settings-card">
        <View
          className="flex-row justify-between items-center px-5"
          style={{
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(195, 198, 211, 0.1)",
          }}
        >
          <Typography variant="text-13-bold-spaced" className="text-cool-gray">
            {t("AccountHub.supportStatus")}
          </Typography>
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Typography variant="text-12-bold" className="text-emerald-600">
              {t("AccountHub.systemWorking")}
            </Typography>
          </View>
        </View>
        <View
          className="flex-row justify-between items-center px-5"
          style={{ paddingVertical: 10 }}
        >
          <Typography variant="text-13-bold-spaced" className="text-cool-gray">
            {t("AccountHub.appVersionLabel")}
          </Typography>
          <Typography variant="text-12-bold" className="text-muted-text">
            {version}
          </Typography>
        </View>
      </View>
    </View>
  );
};
