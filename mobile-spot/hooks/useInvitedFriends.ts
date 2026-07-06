import { getInvitedFriends, GetInvitedFriendsResult } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useInvitedFriends = () => {
  return useGraphQLQuery<GetInvitedFriendsResult>(
    getInvitedFriends,
    {},
    []
  );
};
