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
