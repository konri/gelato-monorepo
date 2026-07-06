import { createGraphQLFunction } from '../../client';
import { MY_FAVORITE_STORES_QUERY } from './query';
import { FavoriteStore, MyFavoriteStoresResponse } from './types';

export const getFavoriteStores = createGraphQLFunction<MyFavoriteStoresResponse, FavoriteStore[]>(
  MY_FAVORITE_STORES_QUERY,
  (response) => response.myFavoriteStores,
  'Failed to fetch favorite stores',
);
