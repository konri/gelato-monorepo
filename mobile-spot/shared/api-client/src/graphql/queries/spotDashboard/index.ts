import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { SPOT_DASHBOARD_QUERY, SPOT_EMPLOYEES_QUERY } from './query';
import {
  SpotDashboard,
  SpotEmployee,
  SpotDashboardResponse,
  SpotEmployeesResponse,
} from './types';

export * from './types';

export const getSpotDashboard = async (
  spotId: string,
  from: string,
  to: string,
  preparedById: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotDashboard | null>> => {
  const res = await executeGraphQLQuery<SpotDashboardResponse>(SPOT_DASHBOARD_QUERY, {
    ...options,
    variables: { spotId, from, to, preparedById: preparedById || undefined },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotDashboard : null };
};

export const getSpotEmployees = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotEmployee[]>> => {
  const res = await executeGraphQLQuery<SpotEmployeesResponse>(SPOT_EMPLOYEES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotEmployees : null };
};
