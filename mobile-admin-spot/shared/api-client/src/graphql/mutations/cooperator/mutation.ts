import { gql } from "@apollo/client";
import {
  COOPERATOR_ACCESS_FIELDS,
  COOPERATOR_INVITATION_FIELDS,
} from "../../queries/cooperatorInvitations/fields";

export const CREATE_COOPERATOR_INVITATION_MUTATION = gql`
  mutation CreateCooperatorInvitation($data: CreateCooperatorInvitationInput!) {
    createCooperatorInvitation(data: $data) {
      webUrl
      deeplinkUrl
      invitation {
        ${COOPERATOR_INVITATION_FIELDS}
      }
    }
  }
`;

export const REVOKE_COOPERATOR_INVITATION_MUTATION = gql`
  mutation RevokeCooperatorInvitation($invitationId: String!) {
    revokeCooperatorInvitation(invitationId: $invitationId) {
      id
      revokedAt
    }
  }
`;

export const ACCEPT_COOPERATOR_INVITATION_MUTATION = gql`
  mutation AcceptCooperatorInvitation($token: String!) {
    acceptCooperatorInvitation(token: $token) {
      token
      cooperatorId
      merchantId
      merchantName
      ${COOPERATOR_ACCESS_FIELDS}
    }
  }
`;

export const UPDATE_COOPERATOR_ACCESS_MUTATION = gql`
  mutation UpdateCooperatorAccess($data: UpdateCooperatorAccessInput!) {
    updateCooperatorAccess(data: $data) {
      id
      scopeMode
      permissions
      storeScopeAll
    }
  }
`;

export const DELETE_COOPERATOR_FROM_COMPANY_MUTATION = gql`
  mutation DeleteCooperatorFromCompany($cooperatorId: String!) {
    deleteCooperatorFromCompany(cooperatorId: $cooperatorId) {
      id
    }
  }
`;
