import { gql } from "@apollo/client";

export const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    getCategories {
      id
      name
      slug
      description
      iconUrl
    }
  }
`;
