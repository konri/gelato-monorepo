import React from 'react';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { StampCard } from '@/components/molecules/StampCard';
import { StampCard as StampCardType } from './types';

interface StampCardSectionProps {
  stampCard: StampCardType;
  categoryIconUrl?: string;
  t: (key: string, params?: any) => string;
}

export const StampCardSection = ({ stampCard, categoryIconUrl, t }: StampCardSectionProps) => {
  const getInfoText = () => {
    if (stampCard.isUsed && !stampCard.isActive) {
      return t('MerchantStore.stampCardUsed');
    }
    if (stampCard.canRedeem) {
      return t('MerchantStore.stampCardUseNow');
    }
    return '';
  };

  const getRateText = () => {
    if (stampCard.canRedeem) {
      return t('MerchantStore.redeemNow');
    }
    return t('MerchantStore.stampCardReward', { reward: stampCard.reward });
  };

  return (
    <RoundedCard className="mt-4 pb-6" variant="less-rounded" shadow>
      <StampCard
        title={t('MerchantStore.stampCard')}
        progress={`${stampCard.current}/${stampCard.required}`}
        description={getInfoText()}
        rateText={getRateText()}
        totalStamps={stampCard.required}
        filledStamps={stampCard.current}
        stampStyleUrl={categoryIconUrl}
      />
    </RoundedCard>
  );
};