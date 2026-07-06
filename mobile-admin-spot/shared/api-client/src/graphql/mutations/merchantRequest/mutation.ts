import { gql } from "@apollo/client";
import { MERCHANT_BASIC_FIELDS } from "../../fragments/merchant";

export const CREATE_MERCHANT_MUTATION = gql`
  ${MERCHANT_BASIC_FIELDS}
  mutation CreateMyMerchant($data: CreateMerchantInput!) {
    createMyMerchant(data: $data) {
      ...MerchantBasicFields
    }
  }
`;
