import { gql } from "@apollo/client";
import { MERCHANT_STORE_BASIC_FIELDS } from "../../../fragments/merchantStore";

export const UPDATE_MERCHANT_STORE_MUTATION = gql`
  ${MERCHANT_STORE_BASIC_FIELDS}
  mutation UpdateMerchantStore($data: UpdateMerchantStoreInput!, $storeId: String!) {
    updateMerchantStore(data: $data, storeId: $storeId) {
      ...MerchantStoreBasicFields
    }
  }
`;

