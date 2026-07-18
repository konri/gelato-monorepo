import { gql } from '@apollo/client';

export const SPOT_POINT_TEMPLATES_QUERY = gql`
  query SpotPointTemplates($spotId: ID!) {
    spotPointTemplates(spotId: $spotId, includeInactive: true) {
      id
      spotId
      name
      points
      isActive
    }
  }
`;

export const CREATE_POINT_TEMPLATE_MUTATION = gql`
  mutation CreatePointTemplate($spotId: ID!, $name: String!, $points: Int!) {
    createPointTemplate(spotId: $spotId, name: $name, points: $points) {
      id
    }
  }
`;

export const UPDATE_POINT_TEMPLATE_MUTATION = gql`
  mutation UpdatePointTemplate($id: ID!, $name: String, $points: Int, $isActive: Boolean) {
    updatePointTemplate(id: $id, name: $name, points: $points, isActive: $isActive) {
      id
    }
  }
`;

export const DELETE_POINT_TEMPLATE_MUTATION = gql`
  mutation DeletePointTemplate($id: ID!) {
    deletePointTemplate(id: $id)
  }
`;

export const LOYALTY_CUSTOMER_QUERY = gql`
  query LoyaltyCustomer($idOrCode: String!) {
    loyaltyCustomer(idOrCode: $idOrCode) {
      id
      name
      loyaltyCode
      profilePicture
      availablePoints
      totalPoints
      availablePrizes
    }
  }
`;

export const AWARD_POINTS_MUTATION = gql`
  mutation AwardPoints($userId: ID!, $points: Int!, $description: String!, $spotId: ID) {
    awardPoints(userId: $userId, points: $points, description: $description, spotId: $spotId)
  }
`;

export const VALIDATE_PRIZE_QR_MUTATION = gql`
  mutation ValidatePrizeQR($qrCode: String!, $spotId: ID) {
    validatePrizeQR(qrCode: $qrCode, spotId: $spotId) {
      id
      isRedeemed
      redeemedAt
      prize {
        id
        title
        pointsCost
      }
    }
  }
`;
