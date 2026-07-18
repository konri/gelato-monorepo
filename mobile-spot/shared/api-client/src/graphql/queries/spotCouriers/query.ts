import { gql } from '@apollo/client';

export const SPOT_COURIERS_QUERY = gql`
  query SpotCouriers($spotId: ID!) {
    spotCouriers(spotId: $spotId) {
      courierId
      userId
      name
      email
      phone
      isOnline
      isAvailable
      totalDeliveries
      totalEarnings
      averageRating
      activeHere
    }
  }
`;

export const SPOT_COURIER_APPLICATIONS_QUERY = gql`
  query SpotCourierApplications($spotId: ID!) {
    spotCourierApplications(spotId: $spotId) {
      id
      courierId
      courierName
      courierPhone
      totalDeliveries
      status
      appliedAt
    }
  }
`;

export const SPOT_COURIER_EARNINGS_QUERY = gql`
  query SpotCourierEarnings($spotId: ID!, $year: Int, $month: Int) {
    spotCourierEarnings(spotId: $spotId, year: $year, month: $month) {
      totalAmount
      totalDeliveries
      couriers {
        courierId
        name
        amount
        deliveries
      }
    }
  }
`;

export const REVIEW_COURIER_APPLICATION_MUTATION = gql`
  mutation ReviewCourierApplication($applicationId: ID!, $approved: Boolean!) {
    reviewCourierApplication(applicationId: $applicationId, approved: $approved)
  }
`;
