import React, { createContext, useContext } from 'react';
import { useCouponModal } from '@/hooks/useCouponModal';

interface CouponModalContextType {
  selectedCoupon: any;
  modalVisible: boolean;
  isActivating: boolean;
  showAnimation: boolean;
  handleCouponPress: (coupon: any) => void;
  handleActivate: () => void;
  handleAnimationComplete: () => void;
  handleClose: () => void;
}

const CouponModalContext = createContext<CouponModalContextType | null>(null);

export function CouponModalProvider({ children }: { children: React.ReactNode }) {
  const modalState = useCouponModal();
  
  return (
    <CouponModalContext.Provider value={modalState}>
      {children}
    </CouponModalContext.Provider>
  );
}

export function useCouponModalContext() {
  const context = useContext(CouponModalContext);
  if (!context) {
    throw new Error('useCouponModalContext must be used within CouponModalProvider');
  }
  return context;
}