import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, View } from "react-native";

import type { CenteredModalCardLayoutProps } from "./types";

export const CenteredModalCardLayout = ({
  visible,
  onClose,
  onApply,
  onReset,
  title,
  resetButtonTitle,
  applyButtonTitle,
  children,
}: CenteredModalCardLayoutProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("LoyaltyListFilter.title");
  const resolvedResetTitle = resetButtonTitle ?? t("LoyaltyListFilter.reset");
  const resolvedApplyTitle = applyButtonTitle ?? t("LoyaltyListFilter.apply");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center px-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.58)" }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View className="w-86 max-w-full h-filter-sheet max-h-modal bg-white rounded-2xl border border-gray-border-modal overflow-hidden flex flex-col">
          <View className="px-4 pt-5 pb-3 shrink-0">
            <Typography variant="text-16-bold" className="text-black text-center">
              {resolvedTitle}
            </Typography>
          </View>

          <ScrollView
            className="flex-1 px-4 min-h-0"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-4 gap-5"
          >
            {children}
          </ScrollView>

          <View className="px-4 pb-5 pt-3 gap-2.5 border-t border-gray-border-modal shrink-0 bg-white">
            <View className="flex-row items-stretch gap-2.5">
              <View className="min-w-0 flex-1">
                <Button
                  title={t("Common.cancel")}
                  onPress={onClose}
                  variant="social"
                  size="sm"
                  width="100%"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Button
                  title={resolvedResetTitle}
                  onPress={onReset}
                  variant="outlineSecondary"
                  size="sm"
                  width="100%"
                />
              </View>
            </View>
            <Button
              title={resolvedApplyTitle}
              onPress={onApply}
              variant="primary"
              size="sm"
              width="100%"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
