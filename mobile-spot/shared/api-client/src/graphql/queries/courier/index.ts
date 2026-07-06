import { executeGraphQLQuery, createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  ACCEPT_DELIVERY_MUTATION,
  APPLY_COURIER_TO_SPOT_MUTATION,
  AVAILABLE_DELIVERIES_QUERY,
  COURIER_PROFILE_QUERY,
  MY_EARNINGS_QUERY,
  END_WORK_SESSION_MUTATION,
  MY_ACTIVE_DELIVERY_QUERY,
  MY_DELIVERY_HISTORY_QUERY,
  MY_ACTIVE_WORK_SESSION_QUERY,
  MY_APPROVED_SPOTS_QUERY,
  MY_COURIER_APPLICATIONS_QUERY,
  START_WORK_SESSION_MUTATION,
  UPDATE_COURIER_LOCATION_MUTATION,
  UPDATE_DELIVERY_STATUS_MUTATION,
} from './query';
import {
  AcceptDeliveryResponse,
  ApplyCourierToSpotResponse,
  AvailableDeliveriesResponse,
  CourierApplication,
  CourierApprovedSpot,
  CourierDelivery,
  EndWorkSessionResponse,
  CourierProfile,
  CourierProfileResponse,
  CourierEarningsSummary,
  MyEarningsResponse,
  MyActiveDeliveryResponse,
  MyDeliveryHistoryResponse,
  MyActiveWorkSessionResponse,
  MyApprovedSpotsResponse,
  MyCourierApplicationsResponse,
  StartWorkSessionResponse,
  UpdateCourierLocationResponse,
  UpdateDeliveryStatusResponse,
  WorkSession,
} from './types';

export * from './types';

export const getMyCourierApplications = createGraphQLFunction<
  MyCourierApplicationsResponse,
  CourierApplication[]
>(
  MY_COURIER_APPLICATIONS_QUERY,
  data => data.myCourierApplications,
  'Failed to load applications',
);

export const applyCourierToSpot = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CourierApplication>> => {
  const res = await executeGraphQLQuery<ApplyCourierToSpotResponse>(
    APPLY_COURIER_TO_SPOT_MUTATION,
    { ...options, variables: { spotId } },
  );
  return { ...res, data: res.data ? res.data.applyCourierToSpot : null };
};

export const getMyApprovedSpots = createGraphQLFunction<
  MyApprovedSpotsResponse,
  CourierApprovedSpot[]
>(MY_APPROVED_SPOTS_QUERY, data => data.myApprovedSpots, 'Failed to load spots');

export const getMyActiveWorkSession = createGraphQLFunction<
  MyActiveWorkSessionResponse,
  WorkSession | null
>(
  MY_ACTIVE_WORK_SESSION_QUERY,
  data => data.myActiveWorkSession,
  'Failed to load work session',
);

export const startWorkSession = async (
  spotIds: string[],
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<WorkSession>> => {
  const res = await executeGraphQLQuery<StartWorkSessionResponse>(
    START_WORK_SESSION_MUTATION,
    { ...options, variables: { spotIds } },
  );
  return { ...res, data: res.data ? res.data.startWorkSession : null };
};

export const endWorkSession = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<EndWorkSessionResponse>(
    END_WORK_SESSION_MUTATION,
    { ...options },
  );
  return { ...res, data: res.data ? res.data.endWorkSession : null };
};

export const getAvailableDeliveries = createGraphQLFunction<
  AvailableDeliveriesResponse,
  CourierDelivery[]
>(
  AVAILABLE_DELIVERIES_QUERY,
  data => data.availableDeliveries,
  'Failed to load deliveries',
);

export const getMyActiveDelivery = createGraphQLFunction<
  MyActiveDeliveryResponse,
  CourierDelivery | null
>(
  MY_ACTIVE_DELIVERY_QUERY,
  data => data.myActiveDelivery,
  'Failed to load active delivery',
);

export const getMyDeliveryHistory = createGraphQLFunction<
  MyDeliveryHistoryResponse,
  CourierDelivery[]
>(
  MY_DELIVERY_HISTORY_QUERY,
  data => data.myDeliveryHistory,
  'Failed to load delivery history',
);

export const getCourierProfile = createGraphQLFunction<
  CourierProfileResponse,
  CourierProfile | null
>(COURIER_PROFILE_QUERY, data => data.courierProfile, 'Failed to load profile');

export const getMyEarnings = createGraphQLFunction<
  MyEarningsResponse,
  CourierEarningsSummary
>(MY_EARNINGS_QUERY, data => data.myEarnings, 'Failed to load earnings');

export const acceptDelivery = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CourierDelivery>> => {
  const res = await executeGraphQLQuery<AcceptDeliveryResponse>(
    ACCEPT_DELIVERY_MUTATION,
    { ...options, variables: { orderId } },
  );
  return { ...res, data: res.data ? res.data.acceptDelivery : null };
};

export const updateDeliveryStatus = async (
  orderId: string,
  status: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<UpdateDeliveryStatusResponse>(
    UPDATE_DELIVERY_STATUS_MUTATION,
    { ...options, variables: { orderId, status } },
  );
  return { ...res, data: res.data ? res.data.updateDeliveryStatus : null };
};

export const updateCourierLocation = async (
  latitude: number,
  longitude: number,
  accuracy?: number,
  orderId?: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<UpdateCourierLocationResponse>(
    UPDATE_COURIER_LOCATION_MUTATION,
    { ...options, variables: { latitude, longitude, accuracy, orderId } },
  );
  return { ...res, data: res.data ? res.data.updateCourierLocation : null };
};
