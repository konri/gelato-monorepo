import { gql } from '@apollo/client';
import { STAFF_MEMBER_FIELDS } from './fragments';
import type { StaffKind } from '../lib/authApi';

export type StaffScopeKind = 'PLATFORM' | 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE' | 'NONE';

export type StaffContext = {
  scope: StaffScopeKind;
  canManageBrand: boolean;
  mustChangePassword: boolean;
  defaultSpotId?: string | null;
  brand?: { id: string; name: string; logoUrl?: string | null; isActive: boolean } | null;
};

export type StaffMember = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  kind?: StaffKind | null;
  brandId?: string | null;
  /** Profile spots; [] for a brand admin (every spot of the brand). */
  spotIds: string[];
  loginDisabled: boolean;
  invitePending: boolean;
  createdAt: string;
};

export type MeUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  language?: string | null;
};

/**
 * The caller's staff scope (works in a restricted session). Selected without
 * `spots`: for PLATFORM those are every active spot with counters.
 */
export const MY_STAFF_CONTEXT = gql`
  query MyStaffContext {
    myStaffContext {
      scope
      canManageBrand
      mustChangePassword
      defaultSpotId
      brand {
        id
        name
        logoUrl
        isActive
      }
    }
  }
`;

/** Identity for a session stored by an older console (no admin_session_v). */
export const ME = gql`
  query Me {
    me {
      id
      email
      name
      roles
      language
    }
  }
`;

/** Staff of a brand (MANAGE_BRAND) or, with spotId, the members at that spot. */
export const BRAND_STAFF = gql`
  query BrandStaff($brandId: ID, $spotId: ID, $kind: StaffKind, $includeDisabled: Boolean = true) {
    brandStaff(brandId: $brandId, spotId: $spotId, kind: $kind, includeDisabled: $includeDisabled) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const INVITE_STAFF = gql`
  mutation InviteStaff($input: InviteStaffInput!) {
    inviteStaff(input: $input) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const SET_SPOT_ADMIN_SPOTS = gql`
  mutation SetSpotAdminSpots($userId: ID!, $spotIds: [ID!]!) {
    setSpotAdminSpots(userId: $userId, spotIds: $spotIds) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const MOVE_EMPLOYEE = gql`
  mutation MoveEmployee($userId: ID!, $spotId: ID!) {
    moveEmployee(userId: $userId, spotId: $spotId) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const CHANGE_STAFF_KIND = gql`
  mutation ChangeStaffKind($userId: ID!, $kind: StaffKind!, $spotIds: [ID!]!) {
    changeStaffKind(userId: $userId, kind: $kind, spotIds: $spotIds) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const REMOVE_STAFF_MEMBER = gql`
  mutation RemoveStaffMember($userId: ID!) {
    removeStaffMember(userId: $userId)
  }
`;

/** A fresh 24 h set-password code by email. */
export const RESEND_ADMIN_INVITE = gql`
  mutation ResendAdminInvite($userId: ID!) {
    resendAdminInvite(userId: $userId)
  }
`;

export const SET_STAFF_LOGIN_DISABLED = gql`
  mutation SetStaffLoginDisabled($userId: ID!, $disabled: Boolean!) {
    setStaffLoginDisabled(userId: $userId, disabled: $disabled)
  }
`;

/** Emails a set-password code and ends the member's sessions. */
export const ADMIN_RESET_STAFF_PASSWORD = gql`
  mutation AdminResetStaffPassword($userId: ID!) {
    adminResetStaffPassword(userId: $userId)
  }
`;
