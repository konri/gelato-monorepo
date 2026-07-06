import { gql } from '@apollo/client';

export const GET_INVITED_FRIENDS_QUERY = gql`
  query GetInvitedFriends {
    getInvitedFriends {
      id
      name
      email
      avatarUrl
      joinedDate
      points
      status
      message
    }
  }
`;
