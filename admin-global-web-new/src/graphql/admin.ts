import { gql } from '@apollo/client';

export type AdminAccount = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
};

export const ADMIN_ACCOUNTS = gql`
  query AdminAccounts {
    adminAccounts {
      id
      email
      name
      roles
    }
  }
`;

export const CREATE_ADMIN_ACCOUNT = gql`
  mutation CreateAdminAccount($email: String!, $name: String!, $role: String!) {
    createAdminAccount(email: $email, name: $name, role: $role) {
      id
      email
      name
      roles
    }
  }
`;

export const CREATE_NEWS = gql`
  mutation CreateNews($input: CreateNewsInput!) {
    createNews(input: $input) {
      id
      title
    }
  }
`;

export const BROADCAST_TO_CLIENTS = gql`
  mutation BroadcastToClients($title: String!, $body: String!, $language: String) {
    broadcastToClients(title: $title, body: $body, language: $language)
  }
`;

export const BROADCAST_TO_CITY = gql`
  mutation BroadcastToCity($cityId: String!, $title: String!, $body: String!, $language: String) {
    broadcastToCity(cityId: $cityId, title: $title, body: $body, language: $language)
  }
`;
