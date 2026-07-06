import { gql } from "@apollo/client";
import { MERCHANT_BASIC_FIELDS } from "../../fragments/merchant";

export const GET_MY_MERCHANTS_QUERY = gql`
  ${MERCHANT_BASIC_FIELDS}
  query MyMerchants {
    myMerchants {
      ...MerchantBasicFields
    }
  }
`;
