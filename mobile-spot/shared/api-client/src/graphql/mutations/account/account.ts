import { gql } from '@apollo/client';

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount {
    deleteAccount
  }
`;

export const SEND_CONTACT_MESSAGE_MUTATION = gql`
  mutation SendContactMessage($email: String!, $title: String!, $message: String!) {
    sendContactMessage(email: $email, title: $title, message: $message)
  }
`;
