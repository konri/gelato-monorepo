import { gql } from '@apollo/client';

export const GET_MY_ACTIVITY_TIMELINE_QUERY = gql`
  query MyActivityTimelineDetailed {
    myActivityTimeline {
      id
      type
      direction
      title
      description
      createdAt
      timeAgoMinutes
      iconUrl
      merchantName
      storeName
      pointsAmount
      stampsAmount
      merchant {
        id
        name
        logoUrl
        description
      }
    }
  }
`;