import type { Merchant } from '@/shared/types/merchants';
import { createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { GET_MERCHANT_BY_ID_QUERY } from './query';
import { GetMerchantByIdResponse } from './types';

export const getMerchantById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Merchant>> => {
  const result = await createGraphQLFunction<GetMerchantByIdResponse, Merchant>(
    GET_MERCHANT_BY_ID_QUERY,
    data => data.getMerchant,
    'Failed to load merchant',
  )({
    ...options,
    variables: { id },
  });

  return result;
};
