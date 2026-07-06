import { gql } from '@apollo/client';

export const REMOVE_FAVORITE_STORE_MUTATION = gql`
  mutation RemoveFavoriteStore($merchantStoreId: String!) {
    removeFavoriteStore(merchantStoreId: $merchantStoreId)
  }
`;
