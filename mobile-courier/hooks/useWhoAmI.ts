import { getWhoAmI } from '@/shared/api-client/src/graphql/queries/user/getWhoAmI';
import { UserData } from '@/shared/api-client/src/graphql/queries/user/types';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useWhoAmI = () => {
  return useGraphQLQuery<UserData>(getWhoAmI, {}, []);
};
