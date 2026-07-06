import { gql } from '@apollo/client';

export const WHO_AM_I_QUERY = gql`
  query {
    whoAmI {
      id
      name
      email
      roles
      firstName
      surname
      phone
      birthDate
      picture
      profileType
      language
      locationPermission
    }
  }
`;

export const SEARCH_USERS_BY_EMAIL_QUERY = gql`
  query SearchUsersByEmail($email: String!, $limit: Int) {
    searchUsersByEmail(email: $email, limit: $limit) {
      id
      email
      name
      firstName
      surname
    }
  }
`;
