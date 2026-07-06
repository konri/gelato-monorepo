import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { firstParam } from "@/utils/firstParam";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PublicWebContentScreen() {
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const url = useMemo(() => firstParam(params.url), [params.url]);
  const title = firstParam(params.title) ?? "";
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!url) {
      router.back();
    }
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <View
      className="flex-1 px-6 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
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
  );
}
