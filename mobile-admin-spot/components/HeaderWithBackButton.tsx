import BonapkaEnterpriseLogo from "@/assets/images/bonapka-enterprise.svg";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type HeaderWithBackButtonProps = {
  title?: string;
  variant?: "default" | "card";
  onBack?: () => void;
  showBackButton?: boolean;
};

type BackButtonProps = {
  onBack?: () => void;
  bgClassName?: string;
};

const useGlass = isLiquidGlassAvailable();

const BackButton = ({
  onBack,
  bgClassName = "bg-white",
}: BackButtonProps) => {
  const handlePress = onBack || (() => router.back());

  if (useGlass) {
    return (
      <Pressable onPress={handlePress} style={styles.glassButton}>
        <GlassView style={styles.glassView} isInteractive>
          <Ionicons name="chevron-back" size={20} color="#000000" />
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`w-10 h-10 rounded-full ${bgClassName} items-center justify-center`}
    >
      <Ionicons name="chevron-back" size={20} color="#616161" />
    </Pressable>
  );
};

export const HeaderWithBackButton = ({
  title,
  variant = "default",
  onBack,
  showBackButton = true,
}: HeaderWithBackButtonProps) => {
  if (variant === "card") {
    return (
      <View className="bg-white rounded-32px mx-6 mb-4 px-4 py-2 flex-row items-center">
        {showBackButton && (
          <View className="mr-3">
            <BackButton onBack={onBack} bgClassName="bg-gray-100" />
          </View>
        )}
        <Typography
          variant="text-18-semibold"
          className="flex-1 text-center mr-10 text-gray-900"
        >
          {title}
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-row items-center px-6 pt-0 pb-1">
      {showBackButton && (
        <View className="mr-3">
          <BackButton onBack={onBack} />
        </View>
      )}
      <View className="flex-row items-center pl-2 shrink">
        <BonapkaEnterpriseLogo width={141} height={22} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  glassView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});
