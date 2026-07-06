import { gql } from '@apollo/client';

export const GET_MERCHANT_BY_ID_QUERY = gql`
  query GetMerchantById($id: String!) {
    getMerchant(id: $id) {
      id
      name
      description
      logoUrl
      coverUrl
      category {
        name
      }
      stores {
        name
        address
        city
        phone
        hours
      }
      vouchers {
        title
        description
        value
        pointsCost
        imageUrl
      }
    }
  }
`;
