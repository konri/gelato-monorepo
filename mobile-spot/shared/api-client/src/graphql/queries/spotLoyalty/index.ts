import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_POINT_TEMPLATES_QUERY,
  CREATE_POINT_TEMPLATE_MUTATION,
  UPDATE_POINT_TEMPLATE_MUTATION,
  DELETE_POINT_TEMPLATE_MUTATION,
  AWARD_POINTS_MUTATION,
  VALIDATE_PRIZE_QR_MUTATION,
  LOYALTY_CUSTOMER_QUERY,
} from './query';
import {
  LoyaltyCustomer,
  LoyaltyCustomerResponse,
  PointTemplate,
  PrizeValidation,
  SpotPointTemplatesResponse,
} from './types';

export * from './types';

// Look up a customer by loyalty QR id or typed account code, so staff can
// confirm who they're awarding points to before awarding.
export const getLoyaltyCustomer = async (
  idOrCode: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<LoyaltyCustomer | null>> => {
  const res = await executeGraphQLQuery<LoyaltyCustomerResponse>(LOYALTY_CUSTOMER_QUERY, {
    ...options,
    variables: { idOrCode },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.loyaltyCustomer : null };
};

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

export const awardPoints = async (
  userId: string,
  points: number,
  description: string,
  spotId: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ awardPoints: boolean }>(AWARD_POINTS_MUTATION, {
    ...options,
    variables: { userId, points, description, spotId: spotId || undefined },
  });
  return { ...res, data: res.data ? res.data.awardPoints : null };
};

export const validatePrizeQr = async (
  qrCode: string,
  spotId: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<PrizeValidation | null>> => {
  const res = await executeGraphQLQuery<{ validatePrizeQR: PrizeValidation }>(
    VALIDATE_PRIZE_QR_MUTATION,
    { ...options, variables: { qrCode, spotId: spotId || undefined } },
  );
  return { ...res, data: res.data ? res.data.validatePrizeQR : null };
};
