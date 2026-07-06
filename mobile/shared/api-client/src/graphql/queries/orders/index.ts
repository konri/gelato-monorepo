import { createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { MY_ORDERS_QUERY, ORDER_DETAIL_QUERY } from './query';
import {
  MyOrdersResponse,
  OrderDetail,
  OrderDetailResponse,
  OrderListEntry,
} from './types';

export * from './types';

export const getMyOrders = createGraphQLFunction<MyOrdersResponse, OrderListEntry[]>(
  MY_ORDERS_QUERY,
  data => data.myOrders,
  'Failed to load orders',
);

export const getOrderById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<OrderDetail | null>> =>
  createGraphQLFunction<OrderDetailResponse, OrderDetail | null>(
    ORDER_DETAIL_QUERY,
    data => data.order,
    'Failed to load order',
  )({ ...options, variables: { id } });
