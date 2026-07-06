import { getMyCoupons, MyCoupon } from '@/shared/api-client';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from './useAuthState';
import { refreshEmitter } from './useRefreshEmitter';

export const useActiveCoupons = () => {
  const [coupons, setCoupons] = useState<MyCoupon[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthState();

  const fetchCoupons = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await getMyCoupons({ token });
      if (result.data) {
        setCoupons(result.data.filter(coupon => !coupon.isUsed));
      }
    } catch (error) {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    return refreshEmitter.subscribe(fetchCoupons);
  }, [fetchCoupons]);

  useFocusEffect(
    useCallback(() => {
      fetchCoupons();
    }, [fetchCoupons])
  );

  return { coupons, isLoading, refetch: fetchCoupons };
};
