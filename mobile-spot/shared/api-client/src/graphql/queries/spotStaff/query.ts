import { gql } from '@apollo/client';

// Admins (SpotAdminProfile) bound to a spot, with login status.
export const SPOT_STAFF_ADMINS_QUERY = gql`
  query SpotStaffAdmins($spotId: ID!) {
    spotStaffAdmins(spotId: $spotId) {
      id
      email
      name
      role
      loginDisabled
      createdAt
    }
  }
`;

// Employees for a spot (returns UserType).
export const SPOT_EMPLOYEES_QUERY = gql`
  query SpotEmployees($spotId: ID!) {
    spotEmployees(spotId: $spotId) {
      id
      email
      name
      loginDisabled
      createdAt
    }
  }
`;

export const SPOT_STAFF_SESSIONS_QUERY = gql`
  query SpotStaffSessions($spotId: ID!, $limit: Int) {
    spotStaffSessions(spotId: $spotId, limit: $limit) {
      id
      userId
      staffName
      role
      ipAddress
      loginAt
    }
  }
`;

export const CREATE_SPOT_STAFF_MUTATION = gql`
  mutation CreateSpotStaff($spotId: ID!, $email: String!, $name: String!, $password: String!, $role: String!) {
    createSpotStaff(spotId: $spotId, email: $email, name: $name, password: $password, role: $role) {
      id
      email
      roles
    }
  }
`;

// Invite a staff member by email (branded set-password email) — no temp password.
export const INVITE_SPOT_STAFF_MUTATION = gql`
  mutation InviteSpotStaff($spotId: ID!, $email: String!, $name: String!, $role: String!) {
    inviteSpotStaff(spotId: $spotId, email: $email, name: $name, role: $role) {
      id
      email
      roles
    }
  }
`;

export const ADMIN_RESET_STAFF_PASSWORD_MUTATION = gql`
  mutation AdminResetStaffPassword($userId: ID!, $newPassword: String!) {
    adminResetStaffPassword(userId: $userId, newPassword: $newPassword)
  }
`;

export const SET_STAFF_LOGIN_DISABLED_MUTATION = gql`
  mutation SetStaffLoginDisabled($userId: ID!, $disabled: Boolean!) {
    setStaffLoginDisabled(userId: $userId, disabled: $disabled)
  }
`;
