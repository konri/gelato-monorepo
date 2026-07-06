import React from 'react';
import { MerchantItemsGroup } from './MerchantItemsGroup';

interface MerchantRewardsGroupProps {
  merchantName: string;
  merchantLogo?: string;
  rewards: any[];
  renderReward: (reward: any) => React.ReactElement;
  itemWidth: number;
  bulletsColor?: string;
}

export function MerchantRewardsGroup({ rewards, renderReward, ...props }: MerchantRewardsGroupProps) {
  return (
    <MerchantItemsGroup
      {...props}
      items={rewards}
      renderItem={renderReward}
      keyExtractor={(item, index) => `${item.id}-${index}`}
    />
  );
}
