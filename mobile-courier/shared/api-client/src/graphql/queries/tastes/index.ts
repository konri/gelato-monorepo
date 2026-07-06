import { executeGraphQLQuery, createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  ALL_SPOTS_QUERY,
  CHECK_DELIVERY_QUERY,
  CITIES_QUERY,
  MY_FAVORITE_SPOTS_QUERY,
  SPOTS_BY_CITY_QUERY,
  SPOT_DETAIL_QUERY,
  SPOT_TASTES_QUERY,
  TASTE_DETAIL_QUERY,
  TOGGLE_FAVORITE_SPOT_MUTATION,
  VALIDATE_PROMO_QUERY,
} from './query';
import {
  AllSpotsResponse,
  CheckDeliveryResponse,
  CitiesResponse,
  City,
  DeliveryAvailability,
  PromoValidation,
  Spot,
  SpotDetailResponse,
  SpotsByCityResponse,
  SpotTastesResponse,
  Taste,
  TasteDetailResponse,
  ValidatePromoResponse,
} from './types';

export * from './types';

export const getCities = createGraphQLFunction<CitiesResponse, City[]>(
  CITIES_QUERY,
  data => data.cities,
  'Failed to load cities',
);

export const getAllSpots = createGraphQLFunction<AllSpotsResponse, Spot[]>(
  ALL_SPOTS_QUERY,
  data => data.spots,
  'Failed to load spots',
);

export const getMyFavoriteSpots = createGraphQLFunction<
  { myFavoriteSpots: { id: string; name: string }[] },
  { id: string; name: string }[]
>(MY_FAVORITE_SPOTS_QUERY, data => data.myFavoriteSpots, 'Failed to load favorites');

export const toggleFavoriteSpot = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ toggleFavoriteSpot: boolean }>(
    TOGGLE_FAVORITE_SPOT_MUTATION,
    { ...options, variables: { spotId } },
  );
  return { ...res, data: res.data ? res.data.toggleFavoriteSpot : null };
};

export const validatePromoCode = async (
  code: string,
  subtotal: number,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<PromoValidation>> =>
  createGraphQLFunction<ValidatePromoResponse, PromoValidation>(
    VALIDATE_PROMO_QUERY,
    data => data.validatePromoCode,
    'Failed to validate code',
  )({ ...options, variables: { code, subtotal } });

export const checkDeliveryAvailability = async (
  spotId: string,
  latitude: number,
  longitude: number,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<DeliveryAvailability>> =>
  createGraphQLFunction<CheckDeliveryResponse, DeliveryAvailability>(
    CHECK_DELIVERY_QUERY,
    data => data.checkDeliveryAvailability,
    'Failed to check delivery availability',
  )({ ...options, variables: { spotId, latitude, longitude } });

export const getSpotsByCity = async (
  cityId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Spot[]>> =>
  createGraphQLFunction<SpotsByCityResponse, Spot[]>(
    SPOTS_BY_CITY_QUERY,
    data => data.spotsByCity,
    'Failed to load spots',
  )({ ...options, variables: { cityId } });

export const getSpotById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Spot | null>> =>
  createGraphQLFunction<SpotDetailResponse, Spot | null>(
    SPOT_DETAIL_QUERY,
    data => data.spot,
    'Failed to load spot',
  )({ ...options, variables: { id } });

export const getSpotTastes = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Taste[]>> =>
  createGraphQLFunction<SpotTastesResponse, Taste[]>(
    SPOT_TASTES_QUERY,
    data => data.spotTastes,
    'Failed to load tastes',
  )({ ...options, variables: { spotId, includeUnavailable: false } });

export const getTasteById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Taste | null>> =>
  createGraphQLFunction<TasteDetailResponse, Taste | null>(
    TASTE_DETAIL_QUERY,
    data => data.taste,
    'Failed to load taste',
  )({ ...options, variables: { id } });
