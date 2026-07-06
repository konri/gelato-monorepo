import React from 'react';
import { View, Dimensions } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { AutoScrollCarousel } from '@/components/atoms/AutoScrollCarousel';
import { StampRewardCard } from '@/components/molecules/StampRewardCard';
import { ActivityType, RedeemableReward } from '@/shared/api-client/src/graphql/queries/stores/types';

const { width: screenWidth } = Dimensions.get('window');

interface RewardsSectionProps {
  rewards: RedeemableReward[];
  storeLogo?: string;
  t: (key: string) => string;
}

export const RewardsSection = ({ rewards, storeLogo, t }: RewardsSectionProps) => {
  if (!rewards || rewards.length === 0) return null;

  const itemWidth = (screenWidth - 48) / 2;
  const slides = [];
  
  for (let i = 0; i < rewards.length; i += 2) {
    slides.push(rewards.slice(i, i + 2));
  }

  return (
    <View className="mt-4 mb-20">
      <Typography variant="header-section-title" className="mb-3 px-6">
        {t('MerchantStore.exchangeForRewards')}
      </Typography>
      <AutoScrollCarousel
        data={slides}
        isLoading={false}
        renderItem={(slideItems) => (
          <View style={{ width: screenWidth }} className="flex-row justify-center px-6">
            {slideItems.map((reward) => (
              <View key={reward.id} style={{ width: itemWidth }}>
                  <StampRewardCard
                      {...reward}
                      type={reward.type === ActivityType.STAMP_CARD ? 'stamp' : 'voucher'}
                      imageUrl={reward.type === ActivityType.STAMP_CARD ? reward.stampCoverUrl : reward.imageUrl}
                      logoUrl={storeLogo}
                      t={t}
                  />
              </View>
            ))}
          </View>
        )}
        keyExtractor={(_slideItems, index) => `slide-${index}`}
        autoScroll={slides.length > 2}
        showPagination={slides.length > 1}
        bulletsColor="bg-accent"
      />
    </View>
  );
};
