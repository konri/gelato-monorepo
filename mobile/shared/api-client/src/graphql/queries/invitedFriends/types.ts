import { ApolloServerConfig } from '../../types';

export type InvitedFriend = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  joinedDate: string;
  points: number;
  status: string;
  message: string;
};

export type GetInvitedFriendsOptions = ApolloServerConfig;

export type GetInvitedFriendsResponse = {
  getInvitedFriends: InvitedFriend[];
};

export type GetInvitedFriendsResult = {
  items: InvitedFriend[];
  total: number;
};
