import { gql } from "@apollo/client";
import { MERCHANT_STORE_BASIC_FIELDS } from "../../fragments/merchantStore";

export const GET_MERCHANT_STORES_QUERY = gql`
  ${MERCHANT_STORE_BASIC_FIELDS}
  query GetMerchantStores {
    myStores {
      ...MerchantStoreBasicFields
    }
  }
`;

