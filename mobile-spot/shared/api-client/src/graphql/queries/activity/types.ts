import { ApolloServerConfig } from '../../types';

export type ActivityTimelineItem = {
  id: string;
  type: string;
  direction: 'INCOMING' | 'OUTGOING';
  title: string;
  description: string;
  createdAt: string;
  timeAgoMinutes: number;
  iconUrl: string | null;
  merchantName: string | null;
  storeName: string | null;
  pointsAmount: number | null;
  stampsAmount: number | null;
  merchant: {
    id: string;
    name: string;
    logoUrl: string;
    description: string;
  } | null;
};

export type GetMyActivityTimelineOptions = ApolloServerConfig;

export type GetMyActivityTimelineResponse = {
  myActivityTimeline: ActivityTimelineItem[];
};