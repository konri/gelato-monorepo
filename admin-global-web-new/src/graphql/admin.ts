import { gql } from '@apollo/client';
import type { StaffKind } from '../lib/authApi';

export type AdminAccount = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  kind?: StaffKind | null;
  brandId?: string | null;
  spotIds?: string[] | null;
  loginDisabled?: boolean | null;
  createdAt: string;
};

/** Admin-namespace accounts (PLATFORM): a read-only directory. */
export const ADMIN_ACCOUNTS = gql`
  query AdminAccounts {
    adminAccounts {
      id
      email
      name
      roles
      kind
      brandId
      spotIds
      loginDisabled
      createdAt
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
