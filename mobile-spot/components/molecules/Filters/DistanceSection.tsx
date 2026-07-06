import { Typography } from '@/components/atoms/Typography';
import { MAX_SEARCH_RADIUS_KM } from '@/shared/constants/filters';
import Slider from '@react-native-community/slider';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface DistanceSectionProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  // Round to 1 decimal place and remove trailing zeros
  const rounded = Math.round(km * 10) / 10;
  return rounded % 1 === 0 ? `${rounded} km` : `${rounded} km`;
};

export const DistanceSection: React.FC<DistanceSectionProps> = ({
  value,
  onChange,
  min = 0.2,
  max = MAX_SEARCH_RADIUS_KM,
}) => {
  const { t } = useTranslation();

  return (
    <View className="py-4">
      <Typography variant="body-base-semibold" className="mb-3">
        {t('Filters.distance')}
      </Typography>
      <View className="flex-row justify-between mb-2">
        <Typography variant="body-small-regular" className="text-red-500">
          0 m
        </Typography>
        <Typography variant="body-small-regular" className="text-red-500">
          {formatDistance(value)}
        </Typography>
      </View>
      <Slider
        value={value}
        onValueChange={onChange}
        minimumValue={min}
        maximumValue={max}
        step={0.2}
        minimumTrackTintColor="#EA3A1D"
        maximumTrackTintColor="#D1D5DB"
        thumbTintColor="#EA3A1D"
        tapToSeek
      />
    </View>
  );
};
