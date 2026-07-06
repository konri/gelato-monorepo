import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Ionicons } from '@expo/vector-icons';
import { StoreDetails } from './types';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { calculateDistance } from '@/utils/distance';

interface AddressCardProps {
  store: StoreDetails;
}

export const AddressCard = ({ store }: AddressCardProps) => {
  const { location } = useCurrentLocation();



  const getDistance = () => {
    if (!location) return '---';
    return calculateDistance(location.latitude, location.longitude, store.latitude, store.longitude);
  };

  return (
    <RoundedCard className="mt-4" variant="less-rounded">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="location-outline" size={20} color="#666" />
          <View className="ml-3 flex-1">
            <Typography variant="body-small-regular" className="text-text-primary">
              {store.address}
            </Typography>
            <Typography variant="body-small-regular" className="text-text-secondary">
              {store.postalCode} {store.city}
            </Typography>
          </View>
        </View>
        <Typography variant="body-small-semibold" className="text-text-primary">
          {getDistance()}
        </Typography>
      </View>
    </RoundedCard>
  );
};