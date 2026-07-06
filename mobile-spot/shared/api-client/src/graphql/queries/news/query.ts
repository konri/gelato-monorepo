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
    }
  }
`;

export const NEWS_COMMENTS_QUERY = gql`
  query NewsComments($newsId: ID!, $limit: Int) {
    newsComments(newsId: $newsId, limit: $limit) {
      id
      userId
      content
      userName
      userAvatar
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
  mutation CommentNews($newsId: ID!, $content: String!) {
    commentNews(newsId: $newsId, content: $content) {
      id
      userId
      content
      userName
      userAvatar
      createdAt
    }
  }
`;
