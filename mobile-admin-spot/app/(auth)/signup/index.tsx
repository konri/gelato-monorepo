import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { SignupForm } from "@/components/molecules/SignupForm";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { useSignUp } from "@/hooks/useSignUp";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { cooperatorInviteRequired, redirectTo } = useLocalSearchParams<{
    cooperatorInviteRequired?: string;
    redirectTo?: string;
  }>();
  const { isGoogleLoading, handleGoogleSignUp, handleAppleSignUp } =
    useSignUp();

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader title={t("SignUp.title")} subtitle={t("SignUp.subtitle")} />

        <View className="gap-5">
          <SignupForm />

          <View className="gap-4">
            <View className="flex-row justify-center items-center gap-2">
              <Typography
                variant="text-18-regular"
                className="text-gray-900"
              >
                {t("SignUp.alreadyHaveAccount")}
              </Typography>
              <TextButton
                title={t("SignUp.signIn")}
                onPress={() =>
                  router.push({
                    pathname: "/login",
                    params: {
                      ...(redirectTo ? { redirectTo } : {}),
                      ...(cooperatorInviteRequired
                        ? { cooperatorInviteRequired }
                        : {}),
                    },
                  })
                }
                variant="primary"
                className="text-blue-900"
              />
            </View>

            <View className="flex-row justify-center items-center gap-4">
              <View className="flex-1 h-px bg-gray-100" />
              <Typography
                variant="text-18-regular"
                className="text-gray-600"
              >
                {t("SignUp.or")}
              </Typography>
              <View className="flex-1 h-px bg-gray-100" />
            </View>

            <SocialMediaButtons
              onGooglePress={handleGoogleSignUp}
              onApplePress={handleAppleSignUp}
              googleText={t("SignUp.continueWithGoogle")}
              appleText={t("SignUp.continueWithApple")}
              isGoogleLoading={isGoogleLoading}
            />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
