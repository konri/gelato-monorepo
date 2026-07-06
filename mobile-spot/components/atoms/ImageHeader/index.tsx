import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from '@/components/atoms/Image';

interface ImageHeaderProps {
  imageUrl?: string;
  onBack?: () => void;
}

export const ImageHeader = ({ imageUrl, onBack }: ImageHeaderProps) => {
  return (
    <View className="relative h-64">
      <Image
        url={imageUrl}
        className="w-full h-full"
        resizeMode="cover"
        fallbackWidth={400}
        fallbackHeight={256}
        fallbackLogoSize={64}
      />
      
      <Pressable
        onPress={onBack || (() => router.back())}
        className="absolute top-16 left-4 w-12 h-12 rounded-full items-center justify-center z-10"
        style={{
          backgroundColor: '#FFFFFF82',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4.1,
          elevation: 4,
        }}
      >
        <View className="-ml-0.5">
          <Ionicons name="chevron-back" size={26} color="#000000" />
        </View>
      </Pressable>
    </View>
  );
};