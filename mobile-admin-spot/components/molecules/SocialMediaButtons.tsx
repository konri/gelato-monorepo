import GoogleIcon from "@/assets/images/login/google_logo.svg";
import { Button } from "@/components/atoms/Button";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface SocialMediaButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  googleText: string;
  appleText: string;
  isGoogleLoading?: boolean;
  isAppleLoading?: boolean;
}

export const SocialMediaButtons = ({
  onGooglePress,
  onApplePress,
  googleText,
  appleText,
  isGoogleLoading = false,
  isAppleLoading = false,
}: SocialMediaButtonsProps) => {
  return (
    <View className="gap-5">
      <Button
        title={isGoogleLoading ? "Ładowanie..." : googleText}
        onPress={onGooglePress}
        variant="social"
        disabled={isGoogleLoading}
        width="100%"
        height={58}
        leftIcon={<GoogleIcon width={24} height={24} />}
        rightIcon={<View className="w-6 h-6" />}
      />

      <Button
        title={isAppleLoading ? "Ładowanie..." : appleText}
        onPress={onApplePress}
        variant="social"
        disabled={isAppleLoading}
        width="100%"
        height={58}
        leftIcon={<Ionicons name="logo-apple" size={24} color="#000000" />}
        rightIcon={<View className="w-6 h-6" />}
      />
    </View>
  );
};
