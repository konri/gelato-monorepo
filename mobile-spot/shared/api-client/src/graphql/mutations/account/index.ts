import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { DELETE_ACCOUNT_MUTATION, SEND_CONTACT_MESSAGE_MUTATION } from './account';

export type DeleteAccountResponse = { deleteAccount: boolean };
export type SendContactMessageResponse = { sendContactMessage: boolean };

export const deleteAccount = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const result = await executeGraphQLQuery<DeleteAccountResponse>(DELETE_ACCOUNT_MUTATION, {
    ...options,
  });
  return { ...result, data: result.data ? result.data.deleteAccount : null };
};

export const sendContactMessage = async (
  options: ApolloServerConfig & { email: string; title: string; message: string },
): Promise<GraphQLResult<boolean>> => {
  const { email, title, message, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<SendContactMessageResponse>(
    SEND_CONTACT_MESSAGE_MUTATION,
    { ...apolloOptions, variables: { email, title, message } },
  );
  return { ...result, data: result.data ? result.data.sendContactMessage : null };
};

export { DELETE_ACCOUNT_MUTATION, SEND_CONTACT_MESSAGE_MUTATION };
