import { createGraphQLFunction, GraphQLOptions } from '../../client';
import { GraphQLResult } from '../../types';
import {
  BRAND_DETAIL_QUERY,
  BRAND_REWARDS_QUERY,
  BRAND_SUMMARY_QUERY,
  BRANDS_IN_CITY_QUERY,
  LOYALTY_OVERVIEW_QUERY,
} from './query';
import {
  BrandDetail,
  BrandDetailResponse,
  BrandReward,
  BrandRewardsResponse,
  BrandsInCityResponse,
  BrandSummaryLite,
  BrandSummaryResponse,
  CityBrand,
  LoyaltyOverviewData,
  LoyaltyOverviewResponse,
  LoyaltyOverviewVariables,
} from './types';

export * from './types';
export {
  BRAND_DETAIL_QUERY,
  BRAND_REWARDS_QUERY,
  BRAND_SUMMARY_QUERY,
  BRANDS_IN_CITY_QUERY,
  LOYALTY_OVERVIEW_QUERY,
  PROMOTION_FIELDS,
  WALLET_BRAND_FIELDS,
} from './query';

type Options = Omit<GraphQLOptions, 'variables'>;

const loyaltyOverviewFn = createGraphQLFunction<LoyaltyOverviewResponse, LoyaltyOverviewData>(
  LOYALTY_OVERVIEW_QUERY,
  (data) => ({ me: data.me, overview: data.myLoyaltyOverview }),
  'Failed to load points',
);

export const getLoyaltyOverview = (
  variables: LoyaltyOverviewVariables = {},
  options: Options = {},
): Promise<GraphQLResult<LoyaltyOverviewData>> =>
  loyaltyOverviewFn({ ...options, variables: variables as Record<string, unknown> });

const brandsInCityFn = createGraphQLFunction<BrandsInCityResponse, CityBrand[]>(
  BRANDS_IN_CITY_QUERY,
  (data) => data.brandsInCity,
  'Failed to load rewards nearby',
);

export const getBrandsInCity = (
  cityId: string,
  options: Options = {},
): Promise<GraphQLResult<CityBrand[]>> => brandsInCityFn({ ...options, variables: { cityId } });

const brandDetailFn = createGraphQLFunction<BrandDetailResponse, BrandDetail | null>(
  BRAND_DETAIL_QUERY,
  (data) => data.brand,
  'Failed to load details',
);

export const getBrandDetail = (
  id: string,
  options: Options = {},
): Promise<GraphQLResult<BrandDetail | null>> => brandDetailFn({ ...options, variables: { id } });

const brandRewardsFn = createGraphQLFunction<BrandRewardsResponse, BrandReward[]>(
  BRAND_REWARDS_QUERY,
  (data) => data.prizes,
  'Failed to load rewards',
);

export const getBrandRewards = (
  brandId: string,
  options: Options = {},
): Promise<GraphQLResult<BrandReward[]>> =>
  brandRewardsFn({ ...options, variables: { brandId } });

const brandSummaryFn = createGraphQLFunction<BrandSummaryResponse, BrandSummaryLite | null>(
  BRAND_SUMMARY_QUERY,
  (data) => data.brand,
  'Failed to load details',
);

export const getBrandSummary = (
  id: string,
  options: Options = {},
): Promise<GraphQLResult<BrandSummaryLite | null>> => brandSummaryFn({ ...options, variables: { id } });
