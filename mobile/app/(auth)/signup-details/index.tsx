import { AuthHeader } from "@/components/molecules/AuthHeader";
import { SignUpDetailsForm } from "@/components/molecules/SignUpDetailsForm";
import { useSignUpDetails } from "@/hooks/useSignUpDetails";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function SignUpDetailsScreen() {
  const { t } = useTranslation();
  const { profileImage, isFirstTimeLogin, phoneNumber, handleImagePicker } =
    useSignUpDetails();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      <View>
        <AuthHeader
          title={t("SignUpDetails.title")}
          subtitle={t("SignUpDetails.subtitle")}
        />

        <SignUpDetailsForm
          isFirstTimeLogin={isFirstTimeLogin}
          profileImage={profileImage}
          phoneNumber={phoneNumber}
          onImagePick={handleImagePicker}
        />
      </View>
    </ScrollView>
  );
}
