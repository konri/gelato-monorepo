import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_COURIERS_QUERY,
  SPOT_COURIER_APPLICATIONS_QUERY,
  SPOT_COURIER_EARNINGS_QUERY,
  SPOT_COURIER_DELIVERIES_QUERY,
  REVIEW_COURIER_APPLICATION_MUTATION,
} from './query';
import {
  SpotCourier,
  SpotCourierApplication,
  SpotCourierEarningsSummary,
  SpotCourierDelivery,
  SpotCouriersResponse,
  SpotCourierApplicationsResponse,
  SpotCourierEarningsResponse,
  SpotCourierDeliveriesResponse,
} from './types';

export * from './types';

export const getSpotCouriers = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotCourier[]>> => {
  const res = await executeGraphQLQuery<SpotCouriersResponse>(SPOT_COURIERS_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotCouriers : null };
};

export const getSpotCourierApplications = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotCourierApplication[]>> => {
  const res = await executeGraphQLQuery<SpotCourierApplicationsResponse>(
    SPOT_COURIER_APPLICATIONS_QUERY,
    { ...options, variables: { spotId }, fetchPolicy: 'network-only' },
  );
  return { ...res, data: res.data ? res.data.spotCourierApplications : null };
};

export const getSpotCourierEarnings = async (
  spotId: string,
  year: number | undefined,
  month: number | undefined,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotCourierEarningsSummary | null>> => {
  const res = await executeGraphQLQuery<SpotCourierEarningsResponse>(
    SPOT_COURIER_EARNINGS_QUERY,
    { ...options, variables: { spotId, year, month }, fetchPolicy: 'network-only' },
  );
  return { ...res, data: res.data ? res.data.spotCourierEarnings : null };
};

export const getSpotCourierDeliveries = async (
  spotId: string,
  courierId: string,
  limit: number | undefined,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotCourierDelivery[]>> => {
  const res = await executeGraphQLQuery<SpotCourierDeliveriesResponse>(
    SPOT_COURIER_DELIVERIES_QUERY,
    { ...options, variables: { spotId, courierId, limit }, fetchPolicy: 'network-only' },
  );
  return { ...res, data: res.data ? res.data.spotCourierDeliveries : null };
};

export const reviewCourierApplication = async (
  applicationId: string,
  approved: boolean,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ reviewCourierApplication: boolean }>(
    REVIEW_COURIER_APPLICATION_MUTATION,
    { ...options, variables: { applicationId, approved } },
  );
  return { ...res, data: res.data ? res.data.reviewCourierApplication : null };
};
