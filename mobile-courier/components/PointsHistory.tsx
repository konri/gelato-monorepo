import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

export function PointsHistory() {
  const { t } = useTranslation();

  const handlePress = () => {
    // TODO: Navigate to points history screen
  };

  return (
    <View className="px-6 mt-4 pb-[120px] items-center">
      <Pressable className="flex-row items-center" onPress={handlePress}>
        <Typography variant="body-small-semibold" className="text-accent mr-2">
          {t('QR.seePointsHistory')}
        </Typography>
        <Typography className="text-accent text-base">→</Typography>
      </Pressable>
    </View>
  );
}