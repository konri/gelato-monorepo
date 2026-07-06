import { variantStyles } from "@/components/atoms/Typography";
import React, { RefObject } from "react";
import { TextInput, View } from "react-native";
import { twMerge } from "tailwind-merge";

interface CodeInputProps {
  code: string[];
  inputRefs: RefObject<TextInput[]>;
  isLoading: boolean;
  onCodeChange: (value: string, index: number) => void;
  onKeyPress: (key: string, index: number) => void;
}

export const CodeInput = ({
  code,
  inputRefs,
  isLoading,
  onCodeChange,
  onKeyPress,
}: CodeInputProps) => (
  <View className="flex-row justify-center gap-1">
    {code.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => {
          if (ref && inputRefs.current) inputRefs.current[index] = ref;
        }}
        className={twMerge(
          "w-12 h-16 rounded-full border-2 text-center text-gray-200",
          digit ? "border-accent bg-white" : "border-gray-200-light bg-white",
          isLoading ? "opacity-50" : ""
        )}
        style={variantStyles["text-32-semibold-38"]}
        value={digit}
        onChangeText={(value) => onCodeChange(value, index)}
        onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, index)}
        keyboardType="numeric"
        selectTextOnFocus
        editable={!isLoading}
      />
    ))}
  </View>
);
