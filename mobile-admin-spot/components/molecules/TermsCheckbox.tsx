import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';

type TermsCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  text: string;
  linkText: string;
  onLinkPress: () => void;
};

export const TermsCheckbox = ({
  checked,
  onToggle,
  text,
  linkText,
  onLinkPress,
}: TermsCheckboxProps) => (
  <View className="flex-row items-center my-5">
    <Pressable
      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${checked ? "bg-blue-900 border-blue-900" : "border-blue-900"}`}
      onPress={onToggle}
    >
      {checked && <Ionicons name="checkmark" size={12} color="white" />}
    </Pressable>
    <View className="flex-1 flex-row flex-wrap">
      <Typography variant="text-12-regular" className="text-gray-500">
        {text}{" "}
      </Typography>
      <Pressable onPress={onLinkPress}>
        <Typography variant="text-12-regular" className="text-blue-900">
          {linkText}
        </Typography>
      </Pressable>
    </View>
  </View>
);
