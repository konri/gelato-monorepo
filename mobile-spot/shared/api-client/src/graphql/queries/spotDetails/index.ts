import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_DETAILS_QUERY,
  UPDATE_SPOT_DETAILS_MUTATION,
  SET_SPOT_PHOTOS_MUTATION,
} from './query';
import { SpotDetails, SpotDetailsResponse } from './types';

export * from './types';

export const getSpotDetails = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotDetails | null>> => {
  const res = await executeGraphQLQuery<SpotDetailsResponse>(SPOT_DETAILS_QUERY, {
    ...options,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spot : null };
};

export const updateSpotDetails = async (
  vars: Record<string, unknown>,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<any>> => {
  const res = await executeGraphQLQuery<any>(UPDATE_SPOT_DETAILS_MUTATION, {
    ...options,
    variables: vars,
  });
  return { ...res, data: res.error ? null : res.data };
};

export const setSpotPhotos = async (
  id: string,
  photos: string[],
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<any>> => {
  const res = await executeGraphQLQuery<any>(SET_SPOT_PHOTOS_MUTATION, {
    ...options,
    variables: { id, photos },
  });
  return { ...res, data: res.error ? null : res.data };
};
