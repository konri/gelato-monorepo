import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { firstParam } from "@/utils/firstParam";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

export default function WebContentScreen() {
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const url = useMemo(() => firstParam(params.url), [params.url]);
  const title = firstParam(params.title) ?? "";

  const [loading, setLoading] = useState(true);
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
    </ProfileTabScreenShell>
  );
}
