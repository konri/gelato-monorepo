import Bonapka from "@/assets/images/bonapka_text.svg";
import Logo from "@/assets/images/logo.svg";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { EXTERNAL_LINKS } from "@/constants/externalLinks";
import { useWelcome } from "@/hooks/useWelcome";
import { navigatePublicWebContent } from "@/utils/navigatePublicWebContent";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

export default function MainLoginScreen() {
  const { t } = useTranslation();
  const {
    isGoogleLoading,
    handleSignUp,
    handleSignIn,
    handleGoogleLogin,
    handleAppleLogin,
  } = useWelcome();

  return (
    <CustomSafeAreaView className="flex-1 bg-gray-50-light">
      <ScrollView
        className="flex-1 px-6 py-9"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-4">
          <Logo width={79} height={74} />
          <Bonapka width={200} height={32} />
        </View>

        <View className="items-center w-full mt-14">
          <Typography
            variant="text-32-bold"
            className="text-center text-gray-900"
          >
            {t("Main.title")}
          </Typography>
          <Typography
            variant="text-18-regular-spaced"
            className="text-center mt-3 text-gray-600"
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
          <Pressable
            onPress={() =>
              navigatePublicWebContent(
                EXTERNAL_LINKS.privacyPolicy,
                t("AccountHub.legalPrivacy"),
              )
            }
          >
            <Typography
              variant="text-14-regular-spaced"
              className="text-center text-blue-900"
            >
              {t("Main.privacyPolicy")}
            </Typography>
          </Pressable>
          <Typography
            variant="text-14-regular-spaced"
            className="text-center text-gray-600"
          >
            •
          </Typography>
          <Pressable
            onPress={() =>
              navigatePublicWebContent(
                EXTERNAL_LINKS.platformTerms,
                t("AccountHub.legalTerms"),
              )
            }
          >
            <Typography
              variant="text-14-regular-spaced"
              className="text-center text-blue-900"
            >
              {t("Main.termsOfService")}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </CustomSafeAreaView>
  );
}

