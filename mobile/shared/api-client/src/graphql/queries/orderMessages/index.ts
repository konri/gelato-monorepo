import { createGraphQLFunction, executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { ORDER_MESSAGES_QUERY, POST_ORDER_MESSAGE_MUTATION } from './query';
import { OrderMessage, OrderMessagesResponse, PostOrderMessageResponse } from './types';

export * from './types';

export const getOrderMessages = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<OrderMessage[]>> =>
  createGraphQLFunction<OrderMessagesResponse, OrderMessage[]>(
    ORDER_MESSAGES_QUERY,
    (data) => data.orderMessages,
    'Failed to load messages',
  )({ ...options, variables: { orderId } });

export const postOrderMessage = async (
  orderId: string,
  body: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<OrderMessage>> => {
  const res = await executeGraphQLQuery<PostOrderMessageResponse>(POST_ORDER_MESSAGE_MUTATION, {
    ...options,
    variables: { orderId, body },
  });
  return { ...res, data: res.data ? res.data.postOrderMessage : null };
};
