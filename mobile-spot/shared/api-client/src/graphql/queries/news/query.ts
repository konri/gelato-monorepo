import { gql } from '@apollo/client';

export const NEWS_FEED_QUERY = gql`
  query NewsFeed($cityId: ID, $limit: Int) {
    newsFeed(cityId: $cityId, limit: $limit) {
      id
      title
      description
      images
      likesCount
      commentsCount
      isLiked
      publishedAt
      createdAt
      spot {
        id
        name
        logoUrl
      }
    }
  }
`;

export const NEWS_COMMENTS_QUERY = gql`
  query NewsComments($newsId: ID!, $limit: Int) {
    newsComments(newsId: $newsId, limit: $limit) {
      id
      userId
      parentId
      content
      userName
      userAvatar
      isSpotReply
      createdAt
    }
  }
`;

export const LIKE_NEWS_MUTATION = gql`
  mutation LikeNews($newsId: ID!) {
    likeNews(newsId: $newsId)
  }
`;

export const COMMENT_NEWS_MUTATION = gql`
  mutation CommentNews($newsId: ID!, $content: String!, $parentId: ID) {
    commentNews(newsId: $newsId, content: $content, parentId: $parentId) {
      id
      userId
      parentId
      content
      userName
      userAvatar
      isSpotReply
      createdAt
    }
  }
`;

// Posts authored by a spot (for the spot app's own news manager).
export const SPOT_NEWS_QUERY = gql`
  query SpotNews($spotId: ID!, $limit: Int) {
    spotNews(spotId: $spotId, limit: $limit) {
      id
      title
      description
      images
      likesCount
      commentsCount
      publishedAt
      createdAt
    }
  }
`;

export const CREATE_SPOT_NEWS_MUTATION = gql`
  mutation CreateSpotNews($input: CreateSpotNewsInput!) {
    createSpotNews(input: $input) {
      id
      title
      images
    }
  }
`;

export const ADD_SPOT_NEWS_IMAGE_MUTATION = gql`
  mutation AddSpotNewsImage($newsId: ID!, $imageUrl: String!) {
    addSpotNewsImage(newsId: $newsId, imageUrl: $imageUrl) {
      id
      images
    }
  }
`;
