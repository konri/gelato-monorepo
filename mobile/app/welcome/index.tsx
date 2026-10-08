import Lockup from "@/assets/images/loodly_lockup.svg";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { LoyaltyCodeFullscreen } from "@/components/molecules/Loyalty/LoyaltyCodeFullscreen";
import { SocialMediaButtons } from "@/components/molecules/SocialMediaButtons";
import { config } from "@/config";
import { useWelcome } from "@/hooks/useWelcome";
import { readLastCard, type LastCard } from "@/utils/loyaltyStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { THEME } from "@/constants/palette";

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

  // After a session EXPIRY the last card stays on the device, so the user can
  // still show it at the counter before logging in again (BRANDS_SPEC §5.4).
  // An explicit logout removes it.
  const [lastCard, setLastCard] = useState<LastCard | null>(null);
  const [showCard, setShowCard] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void readLastCard().then((card) => {
        if (active) setLastCard(card);
      });
      return () => {
        active = false;
      };
    }, []),
  );

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

        {lastCard ? (
          <Pressable
            onPress={() => setShowCard(true)}
            accessibilityRole="button"
            accessibilityLabel={t("LoyaltyCode.showMyCard")}
            className="w-full mt-10 flex-row items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-4 active:opacity-80"
            style={{ minHeight: 56 }}
          >
            <Ionicons name="qr-code-outline" size={24} color={THEME.text} />
            <Text
              className="ml-2 font-urbanist text-gray-900"
              style={{ fontSize: 18, fontWeight: "700" }}
              maxFontSizeMultiplier={1.4}
            >
              {t("LoyaltyCode.showMyCard")}
            </Text>
          </Pressable>
        ) : null}

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
      <LoyaltyCodeFullscreen
        visible={showCard && !!lastCard}
        onClose={() => setShowCard(false)}
        code={lastCard?.loyaltyCode}
        userId={lastCard?.userId}
      />
    </CustomSafeAreaView>
  );
}

