import { Typography } from "@/components/atoms/Typography";
import { useKeyboardAwareScroll } from "@/components/KeyboardAwareScrollView";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";

type InputFieldVariant = "primary" | "compact";

interface InputFieldProps extends TextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  prefix?: string;
  suffix?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  variant?: InputFieldVariant;
  labelBold?: boolean;
  helperText?: string;
}

export const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  iconName,
  leftIcon,
  isPassword = false,
  prefix,
  suffix,
  error,
  rightIcon,
  editable = true,
  variant = "primary",
  labelBold = true,
  helperText,
  ...textInputProps
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isDisabled = editable === false;
  const isCompact = variant === "compact";
  const inputRef = useRef<TextInput>(null);
  const keyboardAwareScroll = useKeyboardAwareScroll();

  const handleFocus = (e: any) => {
    if (keyboardAwareScroll && inputRef.current) {
      keyboardAwareScroll.scrollToInput(inputRef.current);
    }
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };

  const containerClasses = isCompact
    ? `rounded-2xl bg-white flex-row items-center ${
        isDisabled ? "bg-gray-100" : error ? "border border-red-500" : ""
      }`
    : `rounded-32px px-5 py-4 flex-row items-center justify-center border ${
        isDisabled
          ? "bg-gray-100 border-gray-100"
          : error
            ? "bg-white border-red-500"
            : "bg-white border-gray-200"
      }`;

  const containerStyle = isCompact
    ? { paddingVertical: 10, paddingHorizontal: 14 }
    : undefined;

  const textInputStyle = isCompact
    ? {
        fontFamily: "Urbanist",
        fontSize: 14,
        lineHeight: 16,
        letterSpacing: 0.2,
        color: "#212121",
        padding: 0,
        margin: 0,
        includeFontPadding: false,
        textAlignVertical: "center" as const,
      }
    : {
        fontFamily: "Urbanist",
        fontSize: 16,
        lineHeight: 20,
        padding: 0,
        margin: 0,
        color: "#212121",
        includeFontPadding: false,
        textAlignVertical: "center" as const,
      };

  const placeholderColor = isCompact ? "rgba(0, 0, 0, 0.47)" : "#9E9E9E";
  const lockIconSize = isCompact ? 16 : 18;
  const passwordIconSize = isCompact ? 20 : 24;

  return (
    <View className={isCompact ? "w-full min-w-0 gap-2.5" : ""}>
      {isCompact && label && (
        <Typography
          variant={labelBold ? "text-14-bold" : "text-14-regular-spaced"}
          className="text-black"
        >
          {label}
        </Typography>
      )}
      {!isCompact && (
        <Typography
          variant={labelBold ? "text-18-semibold" : "text-18-regular"}
          className="text-gray-900 mb-2"
        >
          {label}
        </Typography>
      )}
      <Pressable
        className={isCompact ? `${containerClasses} w-full min-w-0` : containerClasses}
        style={containerStyle}
        onPress={() => inputRef.current?.focus()}
      >
        {leftIcon && (
          <View style={{ marginRight: isCompact ? 10 : 12 }}>{leftIcon}</View>
        )}
        {iconName && !leftIcon && (
          <Ionicons
            name={iconName}
            size={isCompact ? 18 : 20}
            color="#9E9E9E"
            style={{ marginRight: isCompact ? 10 : 12 }}
          />
        )}
        {prefix && !isCompact && (
          <Typography variant="text-18-regular" className="text-gray-600 mr-1">
            {prefix}
          </Typography>
        )}
        <TextInput
          ref={inputRef}
          className={isCompact ? "flex-1" : "flex-1 text-lg pl-2"}
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          {...textInputProps}
        />
        {isDisabled && !isPassword && (
          <Ionicons
            name="lock-closed-outline"
            size={lockIconSize}
            color="#9E9E9E"
            style={{ marginLeft: isCompact ? 8 : 8 }}
          />
        )}
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={passwordIconSize}
              color="#9E9E9E"
            />
          </Pressable>
        )}
        {suffix && !isPassword && !isDisabled && (
          <Typography
            variant={isCompact ? "text-14-regular-spaced" : "text-18-regular"}
            className="text-black"
          >
            {suffix}
          </Typography>
        )}
        {rightIcon && !isPassword && !isDisabled && (
          <View
            style={isCompact ? { marginLeft: 8 } : undefined}
            className={isCompact ? "" : "ml-2"}
          >
            {rightIcon}
          </View>
        )}
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
    </View>
  );
};
