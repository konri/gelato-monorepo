import { gql } from "@apollo/client";

export const MY_COOPERATORS_QUERY = gql`
  query MyCooperators {
    myCooperators {
      id
      scopeMode
      permissions
      storeScopeAll
      storeIds
      cooperator {
        id
        user {
          email
          name
        }
      }
    }
  }
`;
