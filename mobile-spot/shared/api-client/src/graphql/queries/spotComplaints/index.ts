import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { SPOT_COMPLAINTS_QUERY, RESOLVE_COMPLAINT_MUTATION } from './query';
import { SpotComplaint, SpotComplaintsResponse } from './types';

export * from './types';

export const getSpotComplaints = async (
  spotId: string,
  status: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotComplaint[]>> => {
  const res = await executeGraphQLQuery<SpotComplaintsResponse>(SPOT_COMPLAINTS_QUERY, {
    ...options,
    variables: { spotId, status: status || undefined },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotComplaints : null };
};

export const resolveComplaint = async (
  id: string,
  resolution: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<any>> => {
  const res = await executeGraphQLQuery<any>(RESOLVE_COMPLAINT_MUTATION, {
    ...options,
    variables: { id, resolution },
  });
  return { ...res, data: res.error ? null : res.data };
};
