import { gql } from '@apollo/client';

export const PENDING_REVIEWS_QUERY = gql`
  query PendingReviews {
    pendingReviews {
      orderId
      orderNumber
      spotId
      spotName
      spotLogoUrl
      hasCourier
      deliveredAt
    }
  }
`;

export const MY_REVIEW_QUERY = gql`
  query MyReview($orderId: ID!) {
    myReview(orderId: $orderId) {
      id
      spotRating
      courierRating
      overallRating
      comment
    }
  }
`;

export const SPOT_RATING_SUMMARY_QUERY = gql`
  query SpotRatingSummary($spotId: ID!) {
    spotRatingSummary(spotId: $spotId) {
      averageRating
      reviewCount
    }
  }
`;

export const SPOT_REVIEWS_QUERY = gql`
  query SpotReviews($spotId: ID!, $limit: Int) {
    spotReviews(spotId: $spotId, limit: $limit) {
      id
      rating
      comment
      authorName
      createdAt
    }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview(
    $orderId: ID!
    $spotRating: Int!
    $overallRating: Int!
    $courierRating: Int
    $comment: String
  ) {
    createReview(
      orderId: $orderId
      spotRating: $spotRating
      overallRating: $overallRating
      courierRating: $courierRating
      comment: $comment
    ) {
      id
    }
  }
`;
