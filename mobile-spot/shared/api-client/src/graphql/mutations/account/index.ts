import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { DELETE_ACCOUNT_MUTATION } from './account';

export type DeleteAccountResponse = { deleteAccount: boolean };

export const deleteAccount = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const result = await executeGraphQLQuery<DeleteAccountResponse>(DELETE_ACCOUNT_MUTATION, {
    ...options,
  });
  return { ...result, data: result.data ? result.data.deleteAccount : null };
};

export { DELETE_ACCOUNT_MUTATION };
