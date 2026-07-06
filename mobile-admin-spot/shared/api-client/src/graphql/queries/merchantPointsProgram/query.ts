import { gql } from "@apollo/client";
import { MERCHANT_POINTS_PROGRAM_FIELDS_FRAGMENT } from "../../fragments/merchantPointsProgram";

export const GET_MERCHANT_POINTS_PROGRAM_QUERY = gql`
  ${MERCHANT_POINTS_PROGRAM_FIELDS_FRAGMENT}
  query GetMerchantPointsProgram($merchantId: String!) {
    getMerchantPointsProgram(merchantId: $merchantId) {
      ...MerchantPointsProgramFields
    }
  }
`;

export const MERCHANT_USER_POINT_BALANCE_QUERY = gql`
  query MerchantUserPointBalance($userId: String!, $merchantId: String!) {
    merchantUserPointBalance(userId: $userId, merchantId: $merchantId) {
      userId
      merchantId
      totalPoints
      availablePoints
      lockedPoints
      bonusMultiplier
      fixedPoints
      createdAt
      updatedAt
    }
  }
`;
