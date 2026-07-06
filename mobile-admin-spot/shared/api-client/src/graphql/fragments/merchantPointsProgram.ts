import { gql } from "@apollo/client";

export const MERCHANT_POINTS_PROGRAM_FIELDS_FRAGMENT = gql`
  fragment MerchantPointsProgramFields on MerchantPointsProgram {
    id
    merchantId
    amountSpent
    pointsAwarded
    cardMessage
    isActive
    createdAt
    updatedAt
  }
`;
