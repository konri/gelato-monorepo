import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { HeaderWithBackButton } from "@/components/HeaderWithBackButton";
import { Stack, useSegments } from "expo-router";
import React from "react";

export default function AuthLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const routesWithoutDefaultHeader = ["secure-account"];
  const showHeader = !routesWithoutDefaultHeader.includes(
    currentRoute as string
  );
  const showBackButton =
    currentRoute !== "signup-details" && currentRoute !== "location";

  return (
    <CustomSafeAreaView className="flex-1 bg-gray-50-light">
      {showHeader && (
        <HeaderWithBackButton showBackButton={showBackButton} />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </CustomSafeAreaView>
  );
}
