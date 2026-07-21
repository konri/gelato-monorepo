import { executeGraphQLQuery, createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  CLAIM_ORDER_MUTATION,
  SPOT_ORDERS_QUERY,
  SPOT_ATTENTION_ORDERS_QUERY,
  UPDATE_ORDER_STATUS_MUTATION,
  TERMINATE_ORDER_MUTATION,
  REDISPATCH_ORDER_MUTATION,
} from './query';
import {
  ClaimOrderResponse,
  SpotOrder,
  SpotOrdersResponse,
  SpotAttentionOrdersResponse,
  UpdateOrderStatusResponse,
} from './types';

export * from './types';

export const getSpotOrders = async (
  spotId: string,
  status: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotOrder[]>> =>
  createGraphQLFunction<SpotOrdersResponse, SpotOrder[]>(
    SPOT_ORDERS_QUERY,
    (data) => data.spotOrders,
    'Failed to load orders',
  )({ ...options, variables: { spotId, status: status || undefined } });

export const getSpotAttentionOrders = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotOrder[]>> =>
  createGraphQLFunction<SpotAttentionOrdersResponse, SpotOrder[]>(
    SPOT_ATTENTION_ORDERS_QUERY,
    (data) => data.spotAttentionOrders,
    'Failed to load attention orders',
  )({ ...options, variables: { spotId } });

export const claimOrder = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotOrder>> => {
  const res = await executeGraphQLQuery<ClaimOrderResponse>(CLAIM_ORDER_MUTATION, {
    ...options,
    variables: { orderId },
  });
  return { ...res, data: res.data ? res.data.claimOrder : null };
};

export const updateOrderStatus = async (
  id: string,
  status: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<UpdateOrderStatusResponse>(
    UPDATE_ORDER_STATUS_MUTATION,
    { ...options, variables: { id, status } },
  );
  return { ...res, data: res.data ? res.data.updateOrderStatus : null };
};

export const terminateOrder = async (
  id: string,
  reason: string | undefined,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ terminateOrder: boolean }>(
    TERMINATE_ORDER_MUTATION,
    { ...options, variables: { id, reason } },
  );
  return { ...res, data: res.data ? res.data.terminateOrder : null };
};

// Return an incident-held delivery order to the courier pool (READY) after the
// spot prepares a fresh pack.
export const redispatchOrder = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ redispatchOrder: boolean }>(
    REDISPATCH_ORDER_MUTATION,
    { ...options, variables: { id } },
  );
  return { ...res, data: res.data ? res.data.redispatchOrder : null };
};
