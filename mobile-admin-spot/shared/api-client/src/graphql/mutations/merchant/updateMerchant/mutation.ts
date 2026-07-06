import { gql } from "@apollo/client";
import { MERCHANT_BASIC_FIELDS } from "../../../fragments/merchant";

export const UPDATE_MERCHANT_MUTATION = gql`
  ${MERCHANT_BASIC_FIELDS}
  mutation UpdateMerchant($data: UpdateMerchantInput!, $merchantId: String!) {
    updateMerchant(data: $data, merchantId: $merchantId) {
      ...MerchantBasicFields
    }
  }
`;

