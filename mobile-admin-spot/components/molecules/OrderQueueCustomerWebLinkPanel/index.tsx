import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, Share, Text, View } from "react-native";
import type { OrderQueueCustomerWebLinkPanelProps } from "./types";

export function OrderQueueCustomerWebLinkPanel({
  publicUrl,
}: OrderQueueCustomerWebLinkPanelProps) {
  const { t } = useTranslation();

  const onCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(publicUrl);
      Alert.alert(
        t("OrderQueue.publicWebSessionCopySuccessTitle"),
        t("OrderQueue.publicWebSessionCopySuccessBody"),
      );
    } catch {
      Alert.alert(
        t("Common.error"),
        t("OrderQueue.publicWebSessionCopyErrorBody"),
      );
    }
  }, [publicUrl, t]);

  const onOpen = useCallback(() => {
    void Linking.openURL(publicUrl).catch(() => {
      Alert.alert(
        t("Common.error"),
        t("OrderQueue.publicWebSessionOpenErrorBody"),
      );
    });
  }, [publicUrl, t]);

  const onShare = useCallback(() => {
    void Share.share(
      { message: publicUrl, url: publicUrl },
      { subject: t("OrderQueue.publicWebSessionShareSubject") },
    ).catch(() => {
      Alert.alert(
        t("Common.error"),
        t("OrderQueue.publicWebSessionShareErrorBody"),
      );
    });
  }, [publicUrl, t]);

  return (
    <View className="gap-3 px-4 pb-2">
      <Typography variant="text-12-regular" className="text-gray-600">
        {t("OrderQueue.publicWebSessionDescription")}
      </Typography>
      <Text
        className="text-sm leading-5 text-blue-900"
        selectable
        accessibilityLabel={t("OrderQueue.publicWebSessionUrlA11y")}
      >
        {publicUrl}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => {
            void onCopy();
          }}
          accessibilityRole="button"
          accessibilityLabel={t("OrderQueue.publicWebSessionCopy")}
          className="flex-row items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 active:opacity-90"
        >
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Typography variant="text-14-semibold" className="text-white">
            {t("OrderQueue.publicWebSessionCopy")}
          </Typography>
        </Pressable>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={t("OrderQueue.publicWebSessionOpen")}
          className="flex-row items-center gap-2 rounded-xl border border-blue-900 bg-white px-4 py-3 active:opacity-90"
        >
          <Ionicons name="open-outline" size={18} color="#1e3a5f" />
          <Typography variant="text-14-semibold" className="text-blue-900">
            {t("OrderQueue.publicWebSessionOpen")}
          </Typography>
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={t("OrderQueue.publicWebSessionShare")}
          className="flex-row items-center gap-2 rounded-xl border border-blue-900 bg-white px-4 py-3 active:opacity-90"
        >
          <Ionicons name="share-outline" size={18} color="#1e3a5f" />
          <Typography variant="text-14-semibold" className="text-blue-900">
            {t("OrderQueue.publicWebSessionShare")}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
