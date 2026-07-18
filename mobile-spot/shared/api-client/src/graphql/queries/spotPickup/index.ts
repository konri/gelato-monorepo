import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  COLLECTABLE_PICKUP_ORDERS_QUERY,
  COLLECT_PICKUP_ORDER_MUTATION,
} from './query';
import {
  CollectablePickupOrder,
  CollectablePickupOrdersResponse,
  CollectOrderResult,
  CollectPickupOrderResponse,
} from './types';

export * from './types';

// Open pickup orders a customer can collect at this spot (from a scanned QR/code).
export const getCollectablePickupOrders = async (
  spotId: string,
  userId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CollectablePickupOrder[]>> => {
  const res = await executeGraphQLQuery<CollectablePickupOrdersResponse>(
    COLLECTABLE_PICKUP_ORDERS_QUERY,
    { ...options, variables: { spotId, userId }, fetchPolicy: 'network-only' },
  );
  return { ...res, data: res.data ? res.data.collectablePickupOrders : null };
};

// Mark a pickup order collected (awards points for cash orders).
export const collectPickupOrder = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CollectOrderResult | null>> => {
  const res = await executeGraphQLQuery<CollectPickupOrderResponse>(
    COLLECT_PICKUP_ORDER_MUTATION,
    { ...options, variables: { orderId } },
  );
  return { ...res, data: res.data ? res.data.collectPickupOrder : null };
};
