import { getMyActivityTimeline, ActivityTimelineItem } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useActivityTimeline = () => {
  return useGraphQLQuery<ActivityTimelineItem[]>(
    getMyActivityTimeline,
    {},
    []
  );
};