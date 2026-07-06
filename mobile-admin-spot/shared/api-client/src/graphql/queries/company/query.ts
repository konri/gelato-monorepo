import { gql } from '@apollo/client';

export const GET_COMPANY_BY_NIP_QUERY = gql`
  query GetCompanyByNip($nip: String!) {
    getCompanyByNip(nip: $nip) {
      nip
      name
      regon
      krs
      address
      city
      postalCode
    }
  }
`;

