import { executeGraphQLQuery } from '../client';
import { RemoveFavoriteStoreOptions } from '../queries/favoriteStores/types';
import { REMOVE_FAVORITE_STORE_MUTATION } from './removeFavoriteStore';

export const removeFavoriteStore = async (options: RemoveFavoriteStoreOptions) => {
  const { merchantStoreId, token } = options;

  const result = await executeGraphQLQuery<{ removeFavoriteStore: boolean }>(REMOVE_FAVORITE_STORE_MUTATION, {
    token,
    variables: { merchantStoreId },
  });

  return result;
};
