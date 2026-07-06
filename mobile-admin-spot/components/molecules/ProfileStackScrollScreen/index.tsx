import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import React from "react";
import { ScrollView } from "react-native";
import type { ProfileStackScrollScreenProps } from "./types";

export const ProfileStackScrollScreen = ({
  children,
}: ProfileStackScrollScreenProps) => {
  const scrollBottomInset = useTabBarScrollBottomInset();

  return (
    <ProfileTabScreenShell>
      <ScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1 p-6 gap-4"
        contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </ProfileTabScreenShell>
  );
};
