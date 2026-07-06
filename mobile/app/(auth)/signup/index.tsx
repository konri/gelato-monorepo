import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { Button } from "@/components/atoms/Button";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { SignupForm } from "@/components/molecules/SignupForm";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { useSignUp } from "@/hooks/useSignUp";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isGoogleLoading, handleGoogleSignUp, handleAppleSignUp } =
    useSignUp();

  return (
    <ScrollView
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
                variant="body-lg-regular"
                className="text-text-primary"
              >
                {t("SignUp.alreadyHaveAccount")}
              </Typography>
              <TextButton
                title={t("SignUp.signIn")}
                onPress={() => router.back()}
                variant="primary"
              />
            </View>

            <View className="flex-row justify-center items-center gap-4">
              <View className="flex-1 h-px bg-border-light" />
              <Typography
                variant="body-lg-regular"
                className="text-text-subtitle"
              >
                {t("SignUp.or")}
              </Typography>
              <View className="flex-1 h-px bg-border-light" />
            </View>

            <SocialMediaButtons
              onGooglePress={handleGoogleSignUp}
              onApplePress={handleAppleSignUp}
              googleText={t("SignUp.continueWithGoogle")}
              appleText={t("SignUp.continueWithApple")}
              isGoogleLoading={isGoogleLoading}
            />

            <Button
              title={t("SignUp.continueWithPhone")}
              onPress={() => router.push("/phone-signup")}
              variant="social-large"
              width="100%"
              height={58}
              leftIcon={<Ionicons name="call-outline" size={24} color="#000000" />}
              rightIcon={<View className="w-6 h-6" />}
              iconPadding={16}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
