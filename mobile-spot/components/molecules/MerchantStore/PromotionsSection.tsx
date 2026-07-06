import React from 'react';
import { View, Dimensions } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { AutoScrollCarousel } from '@/components/atoms/AutoScrollCarousel';
import { PromotionCard } from '@/components/molecules/PromotionCard';
import { Promotion } from './types';

const { width: screenWidth } = Dimensions.get('window');

interface PromotionsSectionProps {
  promotions: Promotion[];
  t: (key: string) => string;
  isLoading?: boolean;
  autoScroll?: boolean;
}

export const PromotionsSection = ({ promotions, t, isLoading = false, autoScroll = true }: PromotionsSectionProps) => {
  return (
    <View className="mt-4 mb-12">
        <Typography variant="header-section-title" className="mb-3 px-6">
          {t('MerchantStore.promotionsAndCoupons')}
        </Typography>
        <AutoScrollCarousel
          data={promotions}
          isLoading={isLoading}
          renderItem={(item) => (
            <View style={{ width: screenWidth }}>
              <PromotionCard
                title={item.title}
                description={item.description}
                imageUrl={item.imageUrl}
                value={item.value}
                onPress={() => {
                  // TODO: Implement promotion press handler
                }}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          autoScroll={autoScroll}
          showPagination
        />
    </View>
  );
};