import { getWhoAmI } from '@/shared/api-client/src/graphql/queries/user/getWhoAmI';
import { UserData } from '@/shared/api-client/src/graphql/queries/user/types';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useWhoAmI = (enabled: boolean = true) => {
  // Only fetch when enabled (e.g. after login) — firing `me` without a valid
  // token trips the global session-expiry flow and logs the user out.
  return useGraphQLQuery<UserData>(getWhoAmI, { enabled }, [enabled]);
};
