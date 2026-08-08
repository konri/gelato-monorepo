import GoogleIcon from "@/assets/images/login/google_logo.svg";
import { Button } from "@/components/atoms/Button";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, View } from "react-native";

interface SocialMediaButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  onPhonePress?: () => void;
  googleText: string;
  appleText: string;
  phoneText?: string;
  isGoogleLoading?: boolean;
  isAppleLoading?: boolean;
  /** Apple Sign-In is iOS-only — hide the button where it cannot work. */
  showApple?: boolean;
}

export const SocialMediaButtons = ({
  onGooglePress,
  onApplePress,
  onPhonePress,
  googleText,
  appleText,
  phoneText,
  isGoogleLoading = false,
  isAppleLoading = false,
  showApple = Platform.OS === "ios",
}: SocialMediaButtonsProps) => {
  return (
    <View className="gap-5">
      <Button
        title={isGoogleLoading ? "Ładowanie..." : googleText}
        onPress={onGooglePress}
        variant="social-large"
        disabled={isGoogleLoading}
        width="100%"
        height={58}
        leftIcon={<GoogleIcon width={24} height={24} />}
        rightIcon={<View className="w-6 h-6" />}
        iconPadding={16}
      />

      {showApple && (
        <Button
          title={isAppleLoading ? "Ładowanie..." : appleText}
          onPress={onApplePress}
          variant="social-large"
          disabled={isAppleLoading}
          width="100%"
          height={58}
          leftIcon={<Ionicons name="logo-apple" size={24} color="#000000" />}
          rightIcon={<View className="w-6 h-6" />}
          iconPadding={16}
        />
      )}

      {onPhonePress && phoneText && (
        <Button
          title={phoneText}
          onPress={onPhonePress}
          variant="social-large"
          width="100%"
          height={58}
          leftIcon={<Ionicons name="call-outline" size={24} color="#000000" />}
          rightIcon={<View className="w-6 h-6" />}
          iconPadding={16}
        />
      )}
    </View>
  );
};