import React from 'react';
import { MerchantItemsGroup } from './MerchantItemsGroup';

interface MerchantCouponsGroupProps {
  merchantName: string;
  merchantLogo?: string;
  coupons: any[];
  renderCoupon: (coupon: any) => React.ReactElement;
  itemWidth: number;
  bulletsColor?: string;
}

export function MerchantCouponsGroup({ coupons, renderCoupon, ...props }: MerchantCouponsGroupProps) {
  return (
    <MerchantItemsGroup
      {...props}
      items={coupons}
      renderItem={renderCoupon}
      keyExtractor={(item, index) => `${item.id}-${index}`}
    />
  );
}
