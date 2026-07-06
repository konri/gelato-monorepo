import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { StoreDetails } from './types';
import { config } from '@/config';

interface StoreBasicInfoProps {
  store: StoreDetails;
  descriptionExpanded: boolean;
  onToggleDescription: () => void;
  t: (key: string) => string;
}

export const StoreBasicInfo = ({ 
  store, 
  descriptionExpanded, 
  onToggleDescription, 
  t 
}: StoreBasicInfoProps) => {
  const description = store.description || t('MerchantStore.noDescription');

  return (
    <View className="px-6 mt-4">
      <View className="flex-row items-start">
        {/* Logo */}
        {store.logoUrl ? (
          <Image
            className="w-18 h-18 rounded-full mr-4 mt-6"
            source={{ uri: `${config.API_URL}${store.logoUrl}` }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mr-4">
            <Typography variant="body-base-bold" className="text-white">
              {store.name?.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
        
        {/* Content - three sections vertically */}
        <View className="flex-1">
          {/* Store Name */}
          <Typography variant="body-xl-bold" className="text-text-primary mb-1">
            {store.name}
          </Typography>
          
          {/* Description with expand button */}
          <View className="flex-row items-end mb-2">
            <Typography 
              variant="body-small-regular" 
              className="text-text-secondary flex-1"
              numberOfLines={descriptionExpanded ? undefined : 2}
            >
              {description}
            </Typography>
            {store.description && store.description.length > 80 && (
              <Pressable onPress={onToggleDescription} className="ml-2">
                <Typography variant="body-small-semibold" className="text-accent">
                  {descriptionExpanded ? t('MerchantStore.collapse') : t('MerchantStore.expand')}
                </Typography>
              </Pressable>
            )}
          </View>
          
          {/* Category badge */}
          <View className="self-start px-3 py-1 rounded-full border border-gray-400">
            <Typography variant="body-small-regular" className="text-gray-600">
              {store.category?.name || 'Kategoria'}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
};