import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { firstParam } from "@/utils/firstParam";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";

export default function WebContentScreen() {
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const url = useMemo(() => firstParam(params.url), [params.url]);
  const title = firstParam(params.title) ?? "";
  const scrollBottomInset = useTabBarScrollBottomInset();

  useEffect(() => {
    if (!url) {
      router.back();
    }
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <ProfileTabScreenShell>
      <View
        className="flex-1 px-6 pt-4"
        style={{ paddingBottom: scrollBottomInset }}
      >
        {title ? <TechnicalScreenTitleRow title={title} /> : null}
        <View className="mt-4 flex-1 overflow-hidden rounded-2xl bg-white">
          <iframe
            src={url}
            title={title || url}
            className="h-full w-full min-h-[320px] flex-1 border-0"
          />
        </View>
      </View>
    </ProfileTabScreenShell>
  );
}
