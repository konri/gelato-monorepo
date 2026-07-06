import { executeGraphQLQuery } from '../../client';
import { GET_PROMOTED_COUPONS_BY_LOCATION_QUERY, GET_PROMOTED_COUPONS_BY_CITY_QUERY } from './query';
import { GetPromotedCouponsResponse, PromotedCoupon, GetPromotedCouponsOptions } from './types';

export const getPromotedCoupons = async (options: GetPromotedCouponsOptions = {}) => {
  const { location, cityName, radiusKm, displayType, ...apolloOptions } = options;
  
  if (location) {
    const result = await executeGraphQLQuery<GetPromotedCouponsResponse>(GET_PROMOTED_COUPONS_BY_LOCATION_QUERY, {
      ...apolloOptions,
      variables: {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: location.radiusKm,
        displayType
      }
    });
    
    return {
      ...result,
      data: result.data ? result.data.promotedCoupons : null
    };
  }
  
  if (cityName) {
    const result = await executeGraphQLQuery<GetPromotedCouponsResponse>(GET_PROMOTED_COUPONS_BY_CITY_QUERY, {
      ...apolloOptions,
      variables: {
        cityName,
        radiusKm: radiusKm || 50,
        displayType
      }
    });
    
    return {
      ...result,
      data: result.data ? result.data.promotedCoupons : null
    };
  }
  
  return {
    data: null,
    error: { message: 'Either location or cityName must be provided' },
    success: false
  };
};