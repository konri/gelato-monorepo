import { gql } from "@apollo/client";
import { MERCHANT_STORE_BASIC_FIELDS } from "../../../fragments/merchantStore";

export const CREATE_MERCHANT_STORE_MUTATION = gql`
  ${MERCHANT_STORE_BASIC_FIELDS}
  mutation CreateMerchantStore($data: CreateMerchantStoreInput!, $merchantId: String!) {
    createMerchantStore(data: $data, merchantId: $merchantId) {
      ...MerchantStoreBasicFields
    }
  }
`;

