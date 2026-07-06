import { gql } from '@apollo/client';

export const ADD_FAVORITE_STORE_MUTATION = gql`
  mutation AddFavoriteStore($merchantStoreId: String!) {
    addFavoriteStore(merchantStoreId: $merchantStoreId) {
      id
      merchantStoreId
      createdAt
    }
  }
`;
