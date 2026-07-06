import { gql } from "@apollo/client";

export const REQUEST_TAX_ID_CHANGE_MUTATION = gql`
  mutation RequestTaxIdChange {
    requestTaxIdChange {
      success
    }
  }
`;
