import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { LoginForm } from "@/components/molecules/LoginForm";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { useLogin } from "@/hooks/useLogin";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { isGoogleLoading, handleGoogleLogin, handleAppleLogin } = useLogin();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader title={t("SignIn.title")} subtitle={t("SignIn.subtitle")} />

        <View className="gap-5">
          <LoginForm />

          <View className="gap-4">
            <View className="flex-row justify-center items-center gap-2">
              <Typography
                variant="body-lg-regular"
                className="text-text-primary"
              >
                {t("SignIn.dontHaveAccount")}
              </Typography>
              <TextButton
                title={t("SignIn.register")}
                onPress={() => router.push("/signup")}
                variant="primary"
              />
            </View>

            <View className="flex-row justify-center items-center">
              <TextButton
                title={t("SignIn.dontRememberPassword")}
                onPress={() => router.push("/forgot-password")}
                variant="primary"
              />
            </View>
          </View>
          <View className="flex-row justify-center items-center gap-4">
            <View className="flex-1 h-px bg-border-light" />
            <Typography
              variant="body-lg-regular"
              className="text-text-subtitle"
            >
              {t("SignIn.or")}
            </Typography>
            <View className="flex-1 h-px bg-border-light" />
          </View>

          <SocialMediaButtons
            onGooglePress={handleGoogleLogin}
            onApplePress={handleAppleLogin}
            onPhonePress={() => router.push("/phone-signup")}
            googleText={t("SignIn.continueWithGoogle")}
            appleText={t("SignIn.continueWithApple")}
            phoneText={t("SignIn.loginWithPhone")}
            isGoogleLoading={isGoogleLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
}
