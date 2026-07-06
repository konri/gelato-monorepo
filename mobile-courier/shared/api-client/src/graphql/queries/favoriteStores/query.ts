import { gql } from '@apollo/client';

export const MY_FAVORITE_STORES_QUERY = gql`
  query MyFavoriteStores {
    myFavoriteStores {
      id
      merchantStoreId
      createdAt
      merchantStore {
        id
        name
        city
        logoUrl
        merchant {
          id
          name
          logoUrl
        }
      }
    }
  }
`;
