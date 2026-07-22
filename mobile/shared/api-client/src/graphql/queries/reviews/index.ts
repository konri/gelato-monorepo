import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  PENDING_REVIEWS_QUERY,
  MY_REVIEW_QUERY,
  SPOT_RATING_SUMMARY_QUERY,
  SPOT_REVIEWS_QUERY,
  CREATE_REVIEW_MUTATION,
} from './query';
import {
  PendingReview,
  MyReview,
  SpotRatingSummary,
  PublicReview,
  PendingReviewsResponse,
  MyReviewResponse,
  SpotRatingSummaryResponse,
  SpotReviewsResponse,
} from './types';

export * from './types';

export const getPendingReviews = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<PendingReview[]>> => {
  const res = await executeGraphQLQuery<PendingReviewsResponse>(PENDING_REVIEWS_QUERY, {
    ...options,
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.pendingReviews : null };
};

export const getMyReview = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MyReview | null>> => {
  const res = await executeGraphQLQuery<MyReviewResponse>(MY_REVIEW_QUERY, {
    ...options,
    variables: { orderId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.myReview : null };
};

export const getSpotRatingSummary = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotRatingSummary | null>> => {
  const res = await executeGraphQLQuery<SpotRatingSummaryResponse>(SPOT_RATING_SUMMARY_QUERY, {
    ...options,
    variables: { spotId },
  });
  return { ...res, data: res.data ? res.data.spotRatingSummary : null };
};

export const getSpotReviews = async (
  spotId: string,
  limit = 20,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<PublicReview[]>> => {
  const res = await executeGraphQLQuery<SpotReviewsResponse>(SPOT_REVIEWS_QUERY, {
    ...options,
    variables: { spotId, limit },
  });
  return { ...res, data: res.data ? res.data.spotReviews : null };
};

export const createReview = async (
  input: {
    orderId: string;
    spotRating: number;
    overallRating: number;
    courierRating?: number;
    comment?: string;
  },
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<{ id: string }>> => {
  const res = await executeGraphQLQuery<{ createReview: { id: string } }>(
    CREATE_REVIEW_MUTATION,
    { ...options, variables: input },
  );
  return { ...res, data: res.data ? res.data.createReview : null };
};
