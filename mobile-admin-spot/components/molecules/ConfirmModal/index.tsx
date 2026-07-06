import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { Modal, Pressable, View } from "react-native";
import type { ConfirmModalProps } from "./types";

export const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isLoading = false,
}: ConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center px-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View
          className="rounded-2xl"
          style={{
            width: 349,
            maxWidth: "100%",
            backgroundColor: "#F3F3F3",
            paddingTop: 23,
            paddingRight: 16,
            paddingBottom: 17,
            paddingLeft: 16,
            gap: 8,
          }}
        >
          <Typography
            variant="text-16-bold"
            className="text-center"
            style={{ color: "#1A4196", lineHeight: 19, letterSpacing: 0.2 }}
            numberOfLines={2}
          >
            {title}
          </Typography>
          <View className="items-center justify-center py-[10px]">
            <View
              style={{
                width: 156.5,
                borderTopWidth: 2,
                borderColor: "rgba(7, 58, 167, 0.26)",
              }}
            />
          </View>
          {message && (
            <Typography
              variant="text-16-regular-spaced-lineHeight-19.2"
              className="text-center"
              style={{ color: "#000000" }}
            >
              {message}
            </Typography>
          )}
          <View className="pt-[18px]">
            <View className="flex-row items-stretch gap-[10px]">
              <View className="min-w-0 flex-1">
                <Button
                  title={cancelText}
                  onPress={onClose}
                  variant="social"
                  size="sm"
                  disabled={isLoading}
                  width="100%"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Button
                  title={isLoading ? "..." : confirmText}
                  onPress={onConfirm}
                  variant="primary"
                  size="sm"
                  disabled={isLoading}
                  width="100%"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
