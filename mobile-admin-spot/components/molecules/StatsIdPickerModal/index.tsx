import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, View } from "react-native";

import type { StatsIdPickerModalProps } from "./types";

export const StatsIdPickerModal = ({
  visible,
  title,
  clearLabel,
  items,
  selectedId,
  onSelect,
  onClose,
}: StatsIdPickerModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl w-full max-h-4/5 flex flex-col overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-4 gap-3 border-b border-gray-100-light">
            <Typography variant="text-18-semibold" className="text-gray-900 pr-6">
              {title}
            </Typography>
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              className="py-2 active:opacity-80"
            >
              <Typography variant="text-14-semibold" className="text-blue-900">
                {clearLabel}
              </Typography>
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            style={{ flex: 1, minHeight: 120 }}
            contentContainerClassName="pb-6"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className={`px-4 py-3.5 border-b border-gray-50 ${selected ? "bg-blue-50/80" : ""}`}
                >
                  <Typography
                    variant="text-14-semibold"
                    className={selected ? "text-blue-900" : "text-gray-900"}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Typography>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Typography variant="text-14-regular-spaced" className="text-gray-500 py-6 px-4">
                {t("MerchantStats.pickerEmpty")}
              </Typography>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};
