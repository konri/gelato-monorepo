import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectOption<T = string> = {
  label: string;
  value: T;
};

type SelectProps<T = string> = {
  label: string;
  placeholder: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  helperText?: string;
  editable?: boolean;
  variant?: "primary" | "compact";
  labelBold?: boolean;
};

export const Select = <T = string,>({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  helperText,
  editable = true,
  variant = "primary",
  labelBold = true,
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = variant === "compact";
  const isDisabled = editable === false;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const containerClasses = isCompact
    ? `rounded-2xl bg-white flex-row items-center ${isDisabled
      ? "bg-gray-100"
      : error
        ? "border border-red-500"
        : ""
    }`
    : `rounded-32px px-5 py-4 flex-row items-center justify-center border ${isDisabled
      ? "bg-gray-100 border-gray-100"
      : error
        ? "bg-white border-red-500"
        : "bg-white border-gray-200"
    }`;

  const containerStyle = isCompact
    ? { paddingVertical: 10, paddingHorizontal: 14 }
    : undefined;

  const textStyle = isCompact
    ? {
      fontFamily: "Urbanist",
      fontSize: 14,
      letterSpacing: 0.2,
      color: selectedOption ? "#212121" : "rgba(0, 0, 0, 0.47)",
      paddingVertical: 0,
      paddingTop: 0,
      includeFontPadding: false,
    }
    : {
      fontFamily: "Urbanist",
      fontSize: 16,
      paddingVertical: 0,
      paddingTop: 0,
      color: selectedOption ? "#212121" : "#9E9E9E",
      includeFontPadding: false,
    };

  return (
    <View className={isCompact ? "w-full min-w-0 gap-2.5" : ""}>
      {isCompact && label && (
        <Typography variant={labelBold ? "text-14-bold" : "text-14-regular-spaced"} className="text-black">
          {label}
        </Typography>
      )}
      {!isCompact && (
        <Typography variant={labelBold ? "text-18-semibold" : "text-18-regular"} className="text-gray-900 mb-2">
          {label}
        </Typography>
      )}

      <Pressable
        onPress={() => {
          if (!editable) return;
          Keyboard.dismiss();
          setIsOpen(true);
        }}
        disabled={!editable}
        className={isCompact ? `${containerClasses} w-full min-w-0` : containerClasses}
        style={containerStyle}
      >
        <View className="flex-1 flex-row items-center">
          <Typography
            variant={isCompact ? "text-14-regular-spaced" : "text-16-regular"}
            style={textStyle}
            className="flex-1"
          >
            {displayValue}
          </Typography>
        </View>
        <Ionicons
          name="chevron-down-outline"
          size={isCompact ? 20 : 24}
          color={isDisabled ? "#9E9E9E" : "#212121"}
        />
      </Pressable>

      {error && (
        <Typography
          variant="text-12-regular"
          className={isCompact ? "text-red-500" : "text-red-500 mt-1"}
        >
          {error}
        </Typography>
      )}
      {helperText && !error && (
        <Typography variant="text-12-regular" className="text-black-47">
          {helperText}
        </Typography>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="bg-white rounded-t-3xl"
              style={{
                maxHeight: "90%",
                minHeight: windowHeight * 0.45,
                paddingBottom: insets.bottom,
              }}
            >
              <View className="px-6 py-4 border-b border-gray-100">
                <Typography
                  variant="text-18-semibold"
                  className="text-gray-900"
                >
                  {label}
                </Typography>
              </View>
              <ScrollView
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={true}
              >
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      onPress={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`px-6 py-4 border-b border-gray-100 ${isSelected ? "bg-gray-50" : ""
                        }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Typography
                          variant="text-18-regular"
                          className={
                            isSelected
                              ? "text-blue-900"
                              : "text-gray-900"
                          }
                        >
                          {option.label}
                        </Typography>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={24}
                            color="#1A4196"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
