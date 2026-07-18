import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_STAFF_ADMINS_QUERY,
  SPOT_EMPLOYEES_QUERY,
  SPOT_STAFF_SESSIONS_QUERY,
  CREATE_SPOT_STAFF_MUTATION,
  ADMIN_RESET_STAFF_PASSWORD_MUTATION,
  SET_STAFF_LOGIN_DISABLED_MUTATION,
} from './query';
import {
  StaffMember,
  StaffLoginSession,
  SpotStaffAdminsResponse,
  SpotEmployeesResponse,
  SpotStaffSessionsResponse,
} from './types';

export * from './types';

export const getSpotStaffAdmins = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<StaffMember[]>> => {
  const res = await executeGraphQLQuery<SpotStaffAdminsResponse>(SPOT_STAFF_ADMINS_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotStaffAdmins : null };
};

export const getSpotStaffEmployees = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<StaffMember[]>> => {
  const res = await executeGraphQLQuery<SpotEmployeesResponse>(SPOT_EMPLOYEES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotEmployees : null };
};

export const getSpotStaffSessions = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<StaffLoginSession[]>> => {
  const res = await executeGraphQLQuery<SpotStaffSessionsResponse>(SPOT_STAFF_SESSIONS_QUERY, {
    ...options,
    variables: { spotId, limit: 100 },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotStaffSessions : null };
};

export const createSpotStaff = async (
  input: { spotId: string; email: string; name: string; password: string; role: 'SPOT_ADMIN' | 'EMPLOYEE' },
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<{ id: string; email: string; roles: string[] } | null>> => {
  const res = await executeGraphQLQuery<{ createSpotStaff: { id: string; email: string; roles: string[] } }>(
    CREATE_SPOT_STAFF_MUTATION,
    { ...options, variables: input },
  );
  return { ...res, data: res.data ? res.data.createSpotStaff : null };
};

export const adminResetStaffPassword = async (
  userId: string,
  newPassword: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ adminResetStaffPassword: boolean }>(
    ADMIN_RESET_STAFF_PASSWORD_MUTATION,
    { ...options, variables: { userId, newPassword } },
  );
  return { ...res, data: res.data ? res.data.adminResetStaffPassword : null };
};

export const setStaffLoginDisabled = async (
  userId: string,
  disabled: boolean,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ setStaffLoginDisabled: boolean }>(
    SET_STAFF_LOGIN_DISABLED_MUTATION,
    { ...options, variables: { userId, disabled } },
  );
  return { ...res, data: res.data ? res.data.setStaffLoginDisabled : null };
};
