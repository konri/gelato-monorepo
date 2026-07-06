import { createGraphQLFunction } from '../../client';
import { GET_STORES_FOR_MAP_QUERY } from './query';
import { GetStoresForMapResponse, StoreForMap, GetStoresForMapOptions } from './types';

export const getStoresForMap = createGraphQLFunction<GetStoresForMapResponse, StoreForMap[], GetStoresForMapOptions>(
  GET_STORES_FOR_MAP_QUERY,
  (response) => response.getStoresForMap,
  'Failed to fetch stores for map'
);