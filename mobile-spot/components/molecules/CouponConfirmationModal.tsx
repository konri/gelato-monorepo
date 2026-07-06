import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { CouponActivationAnimation } from '@/components/atoms/CouponActivationAnimation';
import { CouponRenderStrategy } from '@/components/molecules/CouponSection/strategies';
import { useCouponModalContext } from '@/contexts/CouponModalContext';

interface CouponConfirmationModalProps {
  strategy: CouponRenderStrategy;
}

export function CouponConfirmationModal({ 
  strategy
}: CouponConfirmationModalProps) {
  const { t } = useTranslation();
  const { 
    selectedCoupon, 
    modalVisible, 
    isActivating, 
    showAnimation,
    handleActivate, 
    handleAnimationComplete,
    handleClose 
  } = useCouponModalContext();

  const translations = {
    off: t('Common.off')
  };

  return (
    <>
      <Modal
        visible={modalVisible}
        onClose={handleClose}
        headerTitle={t('Modal.confirmCoupon')}
        title={t('Modal.activateTitle')}
        descriptionTitle={t('Modal.activateDescriptionTitle')}
        description={t('Modal.activateDescription')}
        buttons={[
          <Button
            key="activate"
            title={isActivating ? t('Modal.activating') : t('Modal.activateCoupon')}
            onPress={handleActivate}
            variant="outline"
            width="70%"
            height={46}
            disabled={isActivating}
          />,
          <TouchableOpacity key="cancel" onPress={handleClose}>
            <Typography variant="body-base-bold">
              {t('Modal.cancel')}
            </Typography>
          </TouchableOpacity>
        ]}
      >
        <View className="w-full">
          {selectedCoupon && (
            <View className="mb-4">
              {strategy.renderItem(selectedCoupon, translations)}
            </View>
          )}
        </View>
      </Modal>
      
      <CouponActivationAnimation
        visible={showAnimation}
        onComplete={handleAnimationComplete}
        couponData={selectedCoupon}
      />
    </>
  );
}