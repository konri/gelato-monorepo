import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { LoginForm } from "@/components/molecules/LoginForm";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { useLogin } from "@/hooks/useLogin";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { cooperatorInviteRequired, redirectTo } = useLocalSearchParams<{
    cooperatorInviteRequired?: string;
    redirectTo?: string;
  }>();
  const { isGoogleLoading, handleGoogleLogin, handleAppleLogin } = useLogin({
    redirectTo,
  });
  const shouldShowCooperatorInviteBanner =
    cooperatorInviteRequired === "1" || cooperatorInviteRequired === "true";

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader title={t("SignIn.title")} subtitle={t("SignIn.subtitle")} />

        <View className="gap-5">
          {shouldShowCooperatorInviteBanner && (
            <InfoBanner text={t("Cooperators.loginOrRegisterToAcceptInvitation")} />
          )}
          <LoginForm />

          <View className="gap-4">
            <View className="flex-row justify-center items-center gap-2">
              <Typography
                variant="text-18-regular"
                className="text-gray-900"
              >
                {t("SignIn.dontHaveAccount")}
              </Typography>
              <TextButton
                title={t("SignIn.register")}
                onPress={() =>
                  router.push({
                    pathname: "/signup",
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

            <View className="flex-row justify-center items-center">
              <TextButton
                title={t("SignIn.dontRememberPassword")}
                onPress={() => router.push("/forgot-password")}
                variant="primary"
                className="text-blue-900"
              />
            </View>
          </View>
          <View className="flex-row justify-center items-center gap-4">
            <View className="flex-1 h-px bg-gray-100" />
            <Typography
              variant="text-18-regular"
              className="text-gray-600"
            >
              {t("SignIn.or")}
            </Typography>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <SocialMediaButtons
            onGooglePress={handleGoogleLogin}
            onApplePress={handleAppleLogin}
            googleText={t("SignIn.continueWithGoogle")}
            appleText={t("SignIn.continueWithApple")}
            isGoogleLoading={isGoogleLoading}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
