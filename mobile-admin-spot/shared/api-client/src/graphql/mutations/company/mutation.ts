import { gql } from "@apollo/client";

export const CREATE_COMPANY_MUTATION = gql`
  mutation CreateCompanyAndMakeUserOwner($data: CompanyInput!) {
    createCompanyAndMakeUserOwner(data: $data) {
      token
      role
    }
  }
`;
