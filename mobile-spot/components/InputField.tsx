import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

interface InputFieldProps extends TextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  prefix?: string;
  error?: string;
  paddingY?: 'py-4' | 'py-6';
  iconSize?: number;
  iconMargin?: string;
}

export const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  iconName,
  isPassword = false,
  prefix,
  error,
  paddingY = 'py-4',
  iconSize = 20,
  iconMargin = 'mr-3',
  ...textInputProps
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTextChange = (text: string) => {
    // Call onChangeText and use returned value if it exists (for formatting)
    const result = onChangeText(text);
    // If onChangeText returns a value, it means it wants to format the input
    // In that case, we don't need to do anything as the parent will update the value prop
  };

  return (
    <View>
      {label && (
        <Text
          className="text-lg font-semibold text-gray-900 mb-2"
          style={{ fontFamily: "Urbanist" }}
        >
          {label}
        </Text>
      )}
      <View
        className={`bg-white rounded-32px px-5 ${paddingY} flex-row items-center justify-center border ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={iconSize}
            color="#9E9E9E"
            className={iconMargin}
          />
        )}
        {prefix && (
          <Text
            className="text-gray-600 mr-1 text-lg"
            style={{ fontFamily: "Urbanist" }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          className="flex-1 text-lg text-gray-900 pl-2"
          style={{
            fontFamily: "Urbanist",
            fontSize: 16,
            lineHeight: 18,
            paddingVertical: 0,
          }}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={handleTextChange}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="#9E9E9E"
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text
          className="text-red-500 text-sm mt-1"
          style={{ fontFamily: "Urbanist" }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
