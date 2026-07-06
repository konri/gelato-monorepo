import { getPromotedCoupons } from '@/shared/api-client/src/graphql/queries/coupons/getPromotedCoupons';
import { CouponDisplayType, PromotedCoupon } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from './useAuthState';
import { useCurrentLocation } from './useCurrentLocation';
import { refreshEmitter } from './useRefreshEmitter';

interface UseCouponsOptions {
  displayType: CouponDisplayType;
  radiusKm?: number;
}

export const useCoupons = ({ displayType, radiusKm = 50 }: UseCouponsOptions) => {
  const [coupons, setCoupons] = useState<PromotedCoupon[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuthState();
  const { location } = useCurrentLocation();

  const fetchCoupons = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const options: any = { token, displayType };
      
      if (location) {
        options.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm
        };
      } else if (user?.city) {
        options.cityName = user.city;
        options.radiusKm = radiusKm;
      }

      const result = await getPromotedCoupons(options);
      
      if (result.data) {
        setCoupons(result.data);
      }
    } catch (error) {
      logger.error(`Error fetching ${displayType} coupons:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.city, displayType, radiusKm, location]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    return refreshEmitter.subscribe(fetchCoupons);
  }, [fetchCoupons]);

  return { coupons, isLoading };
};