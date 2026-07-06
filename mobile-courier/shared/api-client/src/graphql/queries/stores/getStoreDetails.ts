import { createGraphQLFunction } from '../../client';
import { GET_STORE_DETAILS_QUERY } from './query';
import { GetStoreDetailsResponse, StoreDetails, GetStoreDetailsOptions } from './types';

export const getStoreDetails = createGraphQLFunction<GetStoreDetailsResponse, StoreDetails>(
  GET_STORE_DETAILS_QUERY,
  (response) => response.getStore,
  'Failed to fetch store details'
);