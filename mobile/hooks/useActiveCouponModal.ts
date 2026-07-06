import { triggerGlobalCouponsRefresh } from '@/hooks/useActiveCoupons';
import { useAuthState } from '@/hooks/useAuthState';
import { unclaimCoupon } from '@/shared/api-client';
import { logger } from '@/utils/logger';
import { useState } from 'react';

export function useActiveCouponModal() {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const { token } = useAuthState();

  const handleCouponPress = (coupon: any) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSelectedCoupon(null);
  };

  const handleDeactivate = async () => {
    if (!selectedCoupon || !token) return;
    
    setIsDeactivating(true);
    try {
      const result = await unclaimCoupon({
        couponId: selectedCoupon.coupon.id,
        token
      });
      
      if (result.success) {
        handleClose();
        triggerGlobalCouponsRefresh();
      }
    } catch (error) {
      logger.error('Error deactivating coupon:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  return {
    selectedCoupon,
    modalVisible,
    isDeactivating,
    handleCouponPress,
    handleClose,
    handleDeactivate,
  };
}