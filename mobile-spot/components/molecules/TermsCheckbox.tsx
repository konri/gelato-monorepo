import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  text: string;
  linkText: string;
}

export const TermsCheckbox = ({ checked, onToggle, text, linkText }: TermsCheckboxProps) => (
  <View className="flex-row items-center my-5">
    <Pressable
      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${checked ? 'bg-red-500 border-red-500' : 'border-red-500'}`}
      onPress={onToggle}
    >
      {checked && <Ionicons name="checkmark" size={12} color="white" />}
    </Pressable>
    <Text className="flex-1 text-body-small-regular text-gray-500">
      {text} <Text className="text-red-500">{linkText}</Text>
    </Text>
  </View>
);
