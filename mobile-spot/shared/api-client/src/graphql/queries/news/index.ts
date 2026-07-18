import { createGraphQLFunction, executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  COMMENT_NEWS_MUTATION,
  LIKE_NEWS_MUTATION,
  NEWS_COMMENTS_QUERY,
  NEWS_FEED_QUERY,
  SPOT_NEWS_QUERY,
  CREATE_SPOT_NEWS_MUTATION,
  ADD_SPOT_NEWS_IMAGE_MUTATION,
} from './query';
import {
  NewsComment,
  NewsCommentsResponse,
  NewsFeedResponse,
  NewsItem,
  SpotNewsItem,
  SpotNewsResponse,
} from './types';

export * from './types';

export const getNewsFeed = async (
  cityId: string | null,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<NewsItem[]>> =>
  createGraphQLFunction<NewsFeedResponse, NewsItem[]>(
    NEWS_FEED_QUERY,
    data => data.newsFeed,
    'Failed to load news',
  )({ ...options, variables: { cityId: cityId ?? null, limit: 20 } });

export const getNewsComments = async (
  newsId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<NewsComment[]>> =>
  createGraphQLFunction<NewsCommentsResponse, NewsComment[]>(
    NEWS_COMMENTS_QUERY,
    data => data.newsComments,
    'Failed to load comments',
  )({ ...options, variables: { newsId, limit: 50 } });

export const likeNews = async (
  newsId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ likeNews: boolean }>(LIKE_NEWS_MUTATION, {
    ...options,
    variables: { newsId },
  });
  return { ...res, data: res.data ? res.data.likeNews : null };
};

export const commentNews = async (
  newsId: string,
  content: string,
  options: ApolloServerConfig & { parentId?: string | null } = {},
): Promise<GraphQLResult<NewsComment>> => {
  const { parentId, ...apollo } = options;
  const res = await executeGraphQLQuery<{ commentNews: NewsComment }>(COMMENT_NEWS_MUTATION, {
    ...apollo,
    variables: { newsId, content, parentId: parentId ?? null },
  });
  return { ...res, data: res.data ? res.data.commentNews : null };
};

// --- Spot news composer ---

export const getSpotNews = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<SpotNewsItem[]>> =>
  createGraphQLFunction<SpotNewsResponse, SpotNewsItem[]>(
    SPOT_NEWS_QUERY,
    data => data.spotNews,
    'Failed to load spot news',
  )({ ...options, variables: { spotId, limit: 30 } });

export const createSpotNews = async (
  input: { spotId: string; title: string; description: string; images?: string[] },
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<{ id: string; title: string; images: string[] }>> => {
  const res = await executeGraphQLQuery<{ createSpotNews: { id: string; title: string; images: string[] } }>(
    CREATE_SPOT_NEWS_MUTATION,
    { ...options, variables: { input } },
  );
  return { ...res, data: res.data ? res.data.createSpotNews : null };
};

export const addSpotNewsImage = async (
  newsId: string,
  imageUrl: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<{ id: string; images: string[] }>> => {
  const res = await executeGraphQLQuery<{ addSpotNewsImage: { id: string; images: string[] } }>(
    ADD_SPOT_NEWS_IMAGE_MUTATION,
    { ...options, variables: { newsId, imageUrl } },
  );
  return { ...res, data: res.data ? res.data.addSpotNewsImage : null };
};
