import { createGraphQLFunction } from '../../client';
import { GraphQLResult } from '../../types';
import { GET_MERCHANTS_QUERY } from './query';
import { GetMerchantsOptions, GetMerchantsResponse, GetMerchantsResult } from './types';

// Helper dla getMerchants z obsługą parametrów
export const getMerchants = async (
  options: GetMerchantsOptions = {},
): Promise<GraphQLResult<GetMerchantsResult>> => {
  const { params = {} } = options;

  const variables = {
    search: params.search,
    categoryId: params.category,
    page: params.page,
    pageSize: params.pageSize,
  };

  const result = await createGraphQLFunction<GetMerchantsResponse, GetMerchantsResult>(
    GET_MERCHANTS_QUERY,
    data => ({
      items: data.getMerchants || [],
      total: data.getMerchants?.length || 0,
    }),
    'Failed to load merchants',
  )({
    ...options,
    variables,
  });

  return result;
};
