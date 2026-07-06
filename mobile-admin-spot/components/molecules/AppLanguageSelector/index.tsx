import { Typography } from "@/components/atoms/Typography";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import { supportedLanguages } from "@/constants/supportedLanguages";
import React from "react";
import { Pressable, View } from "react-native";
import type { AppLanguageSelectorProps } from "./types";

export const AppLanguageSelector = ({
  currentUpper,
  onSelectLanguage,
}: AppLanguageSelectorProps) => (
  <SettingsSectionCard>
    <View className="flex-row flex-wrap gap-2 px-2 py-2">
      {supportedLanguages.map((code) => {
        const selected = currentUpper === code;
        return (
          <Pressable
            key={code}
            onPress={() => void onSelectLanguage(code)}
            className={`w-[48%] rounded-3xl border px-3 py-3 items-center ${
              selected
                ? "border-gray-900 bg-gray-50-light"
                : "border-gray-100-light bg-white"
            }`}
          >
            <Typography
              variant="text-16-semibold"
              className={selected ? "text-gray-900" : "text-gray-600"}
            >
              {code}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  </SettingsSectionCard>
);
