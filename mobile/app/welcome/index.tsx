import Lockup from "@/assets/images/loodly_lockup.svg";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { config } from "@/config";
import { useWelcome } from "@/hooks/useWelcome";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, View } from "react-native";

export default function MainLoginScreen() {
  const { t } = useTranslation();
  const {
    isGoogleLoading,
    isAppleLoading,
    isAppleAvailable,
    handleSignUp,
    handleSignIn,
    handleGoogleLogin,
    handleAppleLogin,
  } = useWelcome();

  return (
    <CustomSafeAreaView>
      <ScrollView
        className="flex-1 px-6 py-9"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Lockup width={240} height={166} />
        </View>

        <View className="items-center w-full mt-14">
          <Typography
            variant="heading-32-bold"
            className="text-center text-text-primary"
          >
            {t("Main.title")}
          </Typography>
          <Typography
            variant="subtitle-light-spaced"
            className="text-center mt-3 text-text-subtitle"
          >
            {t("Main.subtitle")}
          </Typography>
        </View>

        <View className="w-full mt-14">
          <SocialMediaButtons
            onGooglePress={handleGoogleLogin}
            onApplePress={handleAppleLogin}
            googleText={t("SignUp.continueWithGoogle")}
            appleText={t("SignUp.continueWithApple")}
            isGoogleLoading={isGoogleLoading}
            isAppleLoading={isAppleLoading}
            showApple={isAppleAvailable}
          />
        </View>

        <View className="w-full mt-14 gap-5">
          <Button
            title={t("Main.signUp")}
            onPress={handleSignUp}
            variant="primary"
            width="100%"
            height={58}
          />

          <Button
            title={t("Main.signIn")}
            onPress={handleSignIn}
            variant="secondary"
            width="100%"
            height={58}
          />
        </View>

        <View className="flex-row justify-center items-center mb-6 gap-3 mt-14">
          <Pressable onPress={() => Linking.openURL(config.PRIVACY_POLICY_URL)}>
            <Typography
              variant="body-medium-regular-spaced"
              className="text-center text-text-subtitle"
            >
              {t("Main.privacyPolicy")}
            </Typography>
          </Pressable>
          <Typography
            variant="body-medium-regular-spaced"
            className="text-center text-text-subtitle"
          >
            •
          </Typography>
          <Pressable onPress={() => Linking.openURL(config.TERMS_URL)}>
            <Typography
              variant="body-medium-regular-spaced"
              className="text-center text-text-subtitle"
            >
              {t("Main.termsOfService")}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </CustomSafeAreaView>
  );
}

