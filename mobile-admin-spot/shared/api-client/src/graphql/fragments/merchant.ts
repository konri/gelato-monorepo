import { gql } from "@apollo/client";

export const MERCHANT_BASIC_FIELDS = gql`
  fragment MerchantBasicFields on Merchant {
    id
    name
    description
    logoUrl
    coverUrl
    iconUrl
    categoryId
  }
`;

