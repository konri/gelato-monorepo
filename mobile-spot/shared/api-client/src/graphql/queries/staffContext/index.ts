import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  MY_STAFF_CONTEXT_QUERY,
  MY_STAFF_SPOTS_QUERY,
  SELECT_ACTIVE_SPOT_MUTATION,
} from './query';
import {
  MyStaffContextResponse,
  MyStaffSpotsResponse,
  SelectActiveSpotResponse,
  StaffContext,
  StaffSpotCounters,
} from './types';

export * from './types';

export const getMyStaffContext = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<StaffContext>> => {
  const res = await executeGraphQLQuery<MyStaffContextResponse>(MY_STAFF_CONTEXT_QUERY, {
    ...options,
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.myStaffContext : null };
};

export const getMyStaffSpots = async (
  vars: { includeInactive?: boolean; limit?: number } = {},
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<StaffSpotCounters[]>> => {
  const res = await executeGraphQLQuery<MyStaffSpotsResponse>(MY_STAFF_SPOTS_QUERY, {
    ...options,
    variables: vars,
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.myStaffSpots : null };
};

export const selectActiveSpot = async (
  spotId: string,
  deviceId: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SelectActiveSpotResponse['selectActiveSpot']>> => {
  const res = await executeGraphQLQuery<SelectActiveSpotResponse>(SELECT_ACTIVE_SPOT_MUTATION, {
    ...options,
    variables: { spotId, deviceId },
  });
  return { ...res, data: res.data ? res.data.selectActiveSpot : null };
};
