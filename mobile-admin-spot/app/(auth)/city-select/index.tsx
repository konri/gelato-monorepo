import { Button } from "@/components/atoms/Button";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { InputField } from "@/components/InputField";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { useCitySelect } from "@/hooks/useCitySelect";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function CitySelectScreen() {
  const { t } = useTranslation();
  const { city, setCity, isLoading, handleConfirm } = useCitySelect();

  return (
    <KeyboardAwareScrollView className="flex-1">
      <View className="gap-8 px-6 py-2">
        <AuthHeader
          title={t("CitySelect.title")}
          subtitle={t("CitySelect.subtitle")}
        />

        <InputField
          label={t("CitySelect.cityLabel")}
          placeholder={t("CitySelect.cityPlaceholder")}
          value={city}
          onChangeText={setCity}
          iconName="location-outline"
          autoCapitalize="words"
        />

        <View className="items-center">
          <Button
            title={isLoading ? t("Common.loading") : t("CitySelect.confirm")}
            onPress={handleConfirm}
            variant="primary"
            disabled={isLoading}
            width="100%"
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}