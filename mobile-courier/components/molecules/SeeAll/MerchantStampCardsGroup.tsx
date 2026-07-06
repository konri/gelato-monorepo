import React from 'react';
import { MerchantItemsGroup } from './MerchantItemsGroup';

interface MerchantStampCardsGroupProps {
  merchantName: string;
  merchantLogo?: string;
  stampCards: any[];
  renderStampCard: (stampCard: any) => React.ReactElement;
  itemWidth: number;
  bulletsColor?: string;
}

export function MerchantStampCardsGroup({ stampCards, renderStampCard, ...props }: MerchantStampCardsGroupProps) {
  return (
    <MerchantItemsGroup
      {...props}
      items={stampCards}
      renderItem={renderStampCard}
      fixedItemWidth={false}
      keyExtractor={(item, index) => `${item.store?.id ?? index}-${index}`}
    />
  );
}
