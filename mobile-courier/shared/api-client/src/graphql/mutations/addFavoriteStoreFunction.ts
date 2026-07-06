import { executeGraphQLQuery } from '../client';
import { AddFavoriteStoreOptions, AddFavoriteStoreResponse } from '../queries/favoriteStores/types';
import { ADD_FAVORITE_STORE_MUTATION } from './addFavoriteStore';

export const addFavoriteStore = async (options: AddFavoriteStoreOptions) => {
  const { merchantStoreId, token } = options;

  const result = await executeGraphQLQuery<AddFavoriteStoreResponse>(ADD_FAVORITE_STORE_MUTATION, {
    token,
    variables: { merchantStoreId },
  });

  return {
    ...result,
    data: result.data ? result.data.addFavoriteStore : null,
  };
};
