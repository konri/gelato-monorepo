import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';
import { THEME } from '@/constants/palette';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChangeText, placeholder, className }) => {
  return (
    <View className={`flex-row items-center bg-white rounded-32px px-4 py-3 mx-6 mb-4 ${className ?? ''}`}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="flex-1 text-base"
        style={{ fontFamily: 'Urbanist' }}
        placeholderTextColor={THEME.placeholder}
      />
      <Ionicons name="search" size={20} color={THEME.placeholder} />
    </View>
  );
};
