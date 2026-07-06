import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isCouponActivatable } from '@/utils/couponUtils';
import { claimCoupon } from '@/shared/api-client';
import { useAuthState } from './useAuthState';

export function useCouponModal() {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { token } = useAuthState();
  const { t } = useTranslation();

  const showInsufficientPointsError = (error: any) => {
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('Insufficient merchant points')) {
      const requiredPoints = selectedCoupon?.pointsCost || 0;
      const currentPoints = 0;
      const missingPoints = requiredPoints - currentPoints;
      
      Alert.alert(
        t('Errors.insufficientPoints'),
        t('Errors.insufficientPointsDetails', {
          required: requiredPoints,
          current: currentPoints,
          missing: missingPoints > 0 ? missingPoints : 0
        }),
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        t('Errors.couponActivationFailed'),
        t('Errors.tryAgainLater'),
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleCouponPress = (coupon: any) => {
    if (isCouponActivatable(coupon)) {
      setSelectedCoupon(coupon);
      setModalVisible(true);
    }
  };

  const handleActivate = async () => {
    if (!selectedCoupon || !token) return;
    
    setIsActivating(true);
    try {
      const result = await claimCoupon({
        couponId: selectedCoupon.id,
        token
      });
      
      if (result.success && result.data) {
        setModalVisible(false);
        setShowAnimation(true);
      } else {
        showInsufficientPointsError(result.error);
        setIsActivating(false);
      }
    } catch (error) {
      showInsufficientPointsError(error);
      setIsActivating(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsActivating(false);
    setSelectedCoupon(null);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSelectedCoupon(null);
  };

  return {
    selectedCoupon,
    modalVisible,
    isActivating,
    showAnimation,
    handleCouponPress,
    handleActivate,
    handleAnimationComplete,
    handleClose,
  };
}