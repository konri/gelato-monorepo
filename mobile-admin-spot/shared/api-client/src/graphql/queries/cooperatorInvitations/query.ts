import { gql } from "@apollo/client";
import {
  COOPERATOR_ACCESS_FIELDS,
  COOPERATOR_INVITATION_FIELDS,
} from "./fields";

export const MY_COOPERATOR_INVITATIONS_QUERY = gql`
  query MyCooperatorInvitations($status: CooperatorInvitationStatus) {
    myCooperatorInvitations(status: $status) {
      ${COOPERATOR_INVITATION_FIELDS}
    }
  }
`;

export const PREVIEW_COOPERATOR_INVITATION_QUERY = gql`
  query PreviewCooperatorInvitation($token: String!) {
    previewCooperatorInvitation(token: $token) {
      valid
      status
      email
      merchantId
      merchantName
      ${COOPERATOR_ACCESS_FIELDS}
      expiresAt
    }
  }
`;
