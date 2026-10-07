import type { DocumentNode } from '@apollo/client';
import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  ADMIN_RESET_STAFF_PASSWORD_MUTATION,
  BRAND_STAFF_QUERY,
  CHANGE_STAFF_KIND_MUTATION,
  INVITE_STAFF_MUTATION,
  MOVE_EMPLOYEE_MUTATION,
  REMOVE_STAFF_MEMBER_MUTATION,
  RESEND_STAFF_INVITE_MUTATION,
  SET_SPOT_ADMIN_SPOTS_MUTATION,
  SET_STAFF_LOGIN_DISABLED_MUTATION,
  SPOT_STAFF_SESSIONS_QUERY,
} from './query';
import type { BrandStaffMember, InviteStaffInput, StaffKind, StaffLoginSession } from './types';

export * from './types';

/**
 * Staff management in the spot app (BRANDS_SPEC §4.7). The server enforces
 * who may create and manage whom; the app only hides what is not allowed.
 */

async function run<R, K extends keyof R>(
  document: DocumentNode,
  field: K,
  variables: Record<string, unknown>,
  options: ApolloServerConfig,
): Promise<GraphQLResult<R[K]>> {
  const res = await executeGraphQLQuery<R>(document, { ...options, variables, fetchPolicy: 'network-only' });
  return { ...res, data: res.data ? res.data[field] : null };
}

/** `{ spotId }`: the spot's team. `{ brandId }`: the whole brand (MANAGE_BRAND). */
export const getBrandStaff = (scope: { spotId?: string; brandId?: string }, options: ApolloServerConfig = {}) =>
  run<{ brandStaff: BrandStaffMember[] }, 'brandStaff'>(
    BRAND_STAFF_QUERY,
    'brandStaff',
    { spotId: scope.spotId ?? null, brandId: scope.brandId ?? null },
    options,
  );

export const inviteStaff = (input: InviteStaffInput, options: ApolloServerConfig = {}) =>
  run<{ inviteStaff: BrandStaffMember }, 'inviteStaff'>(INVITE_STAFF_MUTATION, 'inviteStaff', { input }, options);

export const setSpotAdminSpots = (userId: string, spotIds: string[], options: ApolloServerConfig = {}) =>
  run<{ setSpotAdminSpots: BrandStaffMember }, 'setSpotAdminSpots'>(
    SET_SPOT_ADMIN_SPOTS_MUTATION,
    'setSpotAdminSpots',
    { userId, spotIds },
    options,
  );

export const moveEmployee = (userId: string, spotId: string, options: ApolloServerConfig = {}) =>
  run<{ moveEmployee: BrandStaffMember }, 'moveEmployee'>(MOVE_EMPLOYEE_MUTATION, 'moveEmployee', { userId, spotId }, options);

export const changeStaffKind = (
  userId: string,
  kind: StaffKind,
  spotIds: string[],
  options: ApolloServerConfig = {},
) =>
  run<{ changeStaffKind: BrandStaffMember }, 'changeStaffKind'>(
    CHANGE_STAFF_KIND_MUTATION,
    'changeStaffKind',
    { userId, kind, spotIds },
    options,
  );

export const removeStaffMember = (userId: string, options: ApolloServerConfig = {}) =>
  run<{ removeStaffMember: boolean }, 'removeStaffMember'>(
    REMOVE_STAFF_MEMBER_MUTATION,
    'removeStaffMember',
    { userId },
    options,
  );

export const resendStaffInvite = (userId: string, options: ApolloServerConfig = {}) =>
  run<{ resendAdminInvite: boolean }, 'resendAdminInvite'>(
    RESEND_STAFF_INVITE_MUTATION,
    'resendAdminInvite',
    { userId },
    options,
  );

/** Emails a set-password code; the member's current password stops working. */
export const adminResetStaffPassword = (userId: string, options: ApolloServerConfig = {}) =>
  run<{ adminResetStaffPassword: boolean }, 'adminResetStaffPassword'>(
    ADMIN_RESET_STAFF_PASSWORD_MUTATION,
    'adminResetStaffPassword',
    { userId },
    options,
  );

export const setStaffLoginDisabled = (userId: string, disabled: boolean, options: ApolloServerConfig = {}) =>
  run<{ setStaffLoginDisabled: boolean }, 'setStaffLoginDisabled'>(
    SET_STAFF_LOGIN_DISABLED_MUTATION,
    'setStaffLoginDisabled',
    { userId, disabled },
    options,
  );

export const getSpotStaffSessions = (spotId: string, options: ApolloServerConfig = {}) =>
  run<{ spotStaffSessions: StaffLoginSession[] }, 'spotStaffSessions'>(
    SPOT_STAFF_SESSIONS_QUERY,
    'spotStaffSessions',
    { spotId, limit: 100 },
    options,
  );
