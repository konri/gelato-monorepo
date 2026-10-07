import { gql } from '@apollo/client';

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount {
    deleteAccount
  }
`;
