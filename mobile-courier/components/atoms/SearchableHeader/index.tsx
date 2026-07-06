import React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';

interface SearchableHeaderProps {
  title?: string;
  onBack?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  isSearchActive?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSearchClose?: () => void;
  searchPlaceholder?: string;
}

export const SearchableHeader = ({
  title,
  onBack,
  showSearch = false,
  onSearchPress,
  isSearchActive = false,
  searchQuery = '',
  onSearchChange,
  onSearchClose,
  searchPlaceholder = 'Search...',
}: SearchableHeaderProps) => {
  return (
    <View className="bg-white rounded-32px mx-6 mb-4 px-4 py-2 flex-row items-center">
      <Pressable onPress={onBack || (() => router.back())} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        <Ionicons name="chevron-back" size={20} color="black" />
      </Pressable>
      {isSearchActive ? (
        <>
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            autoFocus
            className="flex-1 text-base"
            style={{fontFamily: 'Urbanist'}}
          />
          <Pressable onPress={onSearchClose} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="close" size={20} color="black" />
          </Pressable>
        </>
      ) : (
        <>
          <Typography variant="body-lg-semibold" className="flex-1 text-center">
            {title}
          </Typography>
          {showSearch ? (
            <Pressable onPress={onSearchPress} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name="search" size={20} color="black" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </>
      )}
    </View>
  );
};