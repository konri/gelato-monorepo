import { gql } from "@apollo/client";

export const DELETE_MERCHANT_STORE_MUTATION = gql`
  mutation DeleteMerchantStore($storeId: String!) {
    deleteMerchantStore(storeId: $storeId)
  }
`;

