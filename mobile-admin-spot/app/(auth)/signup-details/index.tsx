import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { SignUpDetailsForm } from "@/components/molecules/SignUpDetailsForm";
import { useSignUpDetails } from "@/hooks/useSignUpDetails";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export default function SignUpDetailsScreen() {
  const { t } = useTranslation();
  const { isFirstTimeLogin } = useSignUpDetails();

  const skipButton = (
    <View className="flex-1 justify-end items-center">
      <Pressable onPress={() => replaceClearingDismissableStack("/location")}>
        <Text
          className="text-center text-gray-500 text-lg"
          style={{ fontFamily: "Urbanist" }}
        >
          {t("SignUpDetails.skip")}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAwareScrollView
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
          showReferralCode={isFirstTimeLogin}
          successRoute="/location"
          footer={skipButton}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
