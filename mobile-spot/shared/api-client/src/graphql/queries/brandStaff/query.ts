import { gql } from '@apollo/client';

const MEMBER_FIELDS = `
  id
  email
  name
  kind
  role
  brandId
  spotIds
  loginDisabled
  invitePending
  createdAt
  spots {
    id
    name
  }
`;

// The team of one spot (spotId) or of the whole brand (brandId; brand admin
// and the Loodly team). Brand admins themselves are not listed.
export const BRAND_STAFF_QUERY = gql`
  query BrandStaff($spotId: ID, $brandId: ID) {
    brandStaff(spotId: $spotId, brandId: $brandId, includeDisabled: true) {
      ${MEMBER_FIELDS}
    }
  }
`;

// Spot admins: employees for one of their spots. Brand admin / Loodly team:
// employees (one spot) or spot admins (one or more spots).
export const INVITE_STAFF_MUTATION = gql`
  mutation InviteStaff($input: InviteStaffInput!) {
    inviteStaff(input: $input) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const SET_SPOT_ADMIN_SPOTS_MUTATION = gql`
  mutation SetSpotAdminSpots($userId: ID!, $spotIds: [ID!]!) {
    setSpotAdminSpots(userId: $userId, spotIds: $spotIds) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const MOVE_EMPLOYEE_MUTATION = gql`
  mutation MoveEmployee($userId: ID!, $spotId: ID!) {
    moveEmployee(userId: $userId, spotId: $spotId) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const CHANGE_STAFF_KIND_MUTATION = gql`
  mutation ChangeStaffKind($userId: ID!, $kind: StaffKind!, $spotIds: [ID!]!) {
    changeStaffKind(userId: $userId, kind: $kind, spotIds: $spotIds) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const REMOVE_STAFF_MEMBER_MUTATION = gql`
  mutation RemoveStaffMember($userId: ID!) {
    removeStaffMember(userId: $userId)
  }
`;

// A fresh invitation code by email (for members who never signed in).
export const RESEND_STAFF_INVITE_MUTATION = gql`
  mutation ResendAdminInvite($userId: ID!) {
    resendAdminInvite(userId: $userId)
  }
`;

// Emails the staff member a set-password code (they choose their own password).
export const ADMIN_RESET_STAFF_PASSWORD_MUTATION = gql`
  mutation AdminResetStaffPassword($userId: ID!) {
    adminResetStaffPassword(userId: $userId)
  }
`;

export const SET_STAFF_LOGIN_DISABLED_MUTATION = gql`
  mutation SetStaffLoginDisabled($userId: ID!, $disabled: Boolean!) {
    setStaffLoginDisabled(userId: $userId, disabled: $disabled)
  }
`;

// Sign-ins at the spot; with includeSwitches also the "switched to this spot" rows.
export const SPOT_STAFF_SESSIONS_QUERY = gql`
  query SpotStaffSessions($spotId: ID!, $limit: Int) {
    spotStaffSessions(spotId: $spotId, limit: $limit, includeSwitches: true) {
      id
      userId
      staffName
      role
      event
      clientApp
      ipAddress
      loginAt
    }
  }
`;
