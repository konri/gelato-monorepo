import { createGraphQLFunction } from '../../client';
import { GET_INVITED_FRIENDS_QUERY } from './query';
import { GetInvitedFriendsResponse, GetInvitedFriendsResult } from './types';

export const getInvitedFriends = createGraphQLFunction<
  GetInvitedFriendsResponse,
  GetInvitedFriendsResult
>(
  GET_INVITED_FRIENDS_QUERY,
  data => ({
    items: data.getInvitedFriends,
    total: data.getInvitedFriends.length,
  }),
  'Failed to load invited friends',
);
