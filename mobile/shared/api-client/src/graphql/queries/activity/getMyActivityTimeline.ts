import { createGraphQLFunction } from '../../client';
import { GET_MY_ACTIVITY_TIMELINE_QUERY } from './query';
import { GetMyActivityTimelineResponse, ActivityTimelineItem } from './types';

export const getMyActivityTimeline = createGraphQLFunction<GetMyActivityTimelineResponse, ActivityTimelineItem[]>(
  GET_MY_ACTIVITY_TIMELINE_QUERY,
  data => data.myActivityTimeline,
  'Failed to load activity timeline',
);