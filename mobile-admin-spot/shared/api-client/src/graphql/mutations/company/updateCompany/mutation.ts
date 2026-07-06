import { gql } from "@apollo/client";
import { COMPANY_BASIC_FIELDS } from "../../../fragments/company";

export const UPDATE_COMPANY_MUTATION = gql`
  ${COMPANY_BASIC_FIELDS}
  mutation UpdateCompany($data: CompanyInput!) {
    updateCompany(data: $data) {
      ...CompanyBasicFields
    }
  }
`;
