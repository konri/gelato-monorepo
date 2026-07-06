import { executeGraphQLQuery } from '../../client';
import { GET_PROMOTED_VOUCHERS_BY_LOCATION_QUERY, GET_PROMOTED_VOUCHERS_BY_CITY_QUERY } from './query';
import { GetPromotedVouchersResponse, PromotedVoucher, GetPromotedVouchersOptions } from './types';

export const getPromotedVouchers = async (options: GetPromotedVouchersOptions = {}) => {
  const { location, cityName, radiusKm, displayType, ...apolloOptions } = options;
  
  if (location) {
    const result = await executeGraphQLQuery<GetPromotedVouchersResponse>(GET_PROMOTED_VOUCHERS_BY_LOCATION_QUERY, {
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
      data: result.data ? result.data.promotedVouchers : null
    };
  }
  
  if (cityName) {
    const result = await executeGraphQLQuery<GetPromotedVouchersResponse>(GET_PROMOTED_VOUCHERS_BY_CITY_QUERY, {
      ...apolloOptions,
      variables: {
        cityName,
        radiusKm: radiusKm || 50,
        displayType
      }
    });
    
    return {
      ...result,
      data: result.data ? result.data.promotedVouchers : null
    };
  }
  
  return {
    data: null,
    error: { message: 'Either location or cityName must be provided' },
    success: false
  };
};
