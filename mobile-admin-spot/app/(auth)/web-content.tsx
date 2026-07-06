import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { firstParam } from "@/utils/firstParam";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PublicWebContentScreen() {
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const url = useMemo(() => firstParam(params.url), [params.url]);
  const title = firstParam(params.title) ?? "";
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);

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
      <View className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-white">
        {loading ? (
          <View className="absolute inset-0 z-10 items-center justify-center bg-white">
            <ActivityIndicator />
          </View>
        ) : null}
        <WebView
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          className="flex-1"
        />
      </View>
    </View>
  );
}
