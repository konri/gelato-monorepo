import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_POINT_TEMPLATES_QUERY,
  CREATE_POINT_TEMPLATE_MUTATION,
  UPDATE_POINT_TEMPLATE_MUTATION,
  DELETE_POINT_TEMPLATE_MUTATION,
} from './query';
import { PointTemplate, SpotPointTemplatesResponse } from './types';

export * from './types';

// Point templates of a spot (what staff pick when awarding at the counter).
// Scanning, awarding and reward hand-over live in ../staffLoyalty.
export const getPointTemplates = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<PointTemplate[]>> => {
  const res = await executeGraphQLQuery<SpotPointTemplatesResponse>(SPOT_POINT_TEMPLATES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotPointTemplates : null };
};

const run = async (query: any, variables: Record<string, unknown>, options: ApolloServerConfig) => {
  const res = await executeGraphQLQuery<any>(query, { ...options, variables });
  return { ...res, data: res.error ? null : res.data };
};

export const createPointTemplate = (spotId: string, name: string, points: number, o: ApolloServerConfig = {}) =>
  run(CREATE_POINT_TEMPLATE_MUTATION, { spotId, name, points }, o);
export const updatePointTemplate = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(UPDATE_POINT_TEMPLATE_MUTATION, vars, o);
export const deletePointTemplate = (id: string, o: ApolloServerConfig = {}) =>
  run(DELETE_POINT_TEMPLATE_MUTATION, { id }, o);
