import { gql } from "@apollo/client";

export const COMPANY_BASIC_FIELDS = gql`
  fragment CompanyBasicFields on Company {
    id
    name
    taxId
    address
    city
    postalCode
    country
    cityOperate
    phone
    email
    website
    facebook
    instagram
    tiktok
  }
`;
