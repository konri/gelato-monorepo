import { gql } from "@apollo/client";
import { COMPANY_BASIC_FIELDS } from "../../fragments/company";

export const GET_MY_COMPANY_QUERY = gql`
  ${COMPANY_BASIC_FIELDS}
  query GetMyCompany {
    getMyCompany {
      ...CompanyBasicFields
      logo {
        id
        fileName
        filePath
        filePreview
      }
      createdAt
    }
  }
`;
