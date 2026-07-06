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

  return (
    <CustomSafeAreaView>
      {showHeader && <HeaderWithBackButton />}
      <Stack screenOptions={{ headerShown: false }} />
    </CustomSafeAreaView>
  );
}
