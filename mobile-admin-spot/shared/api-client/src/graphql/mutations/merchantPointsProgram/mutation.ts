import { gql } from "@apollo/client";
import { MERCHANT_POINTS_PROGRAM_FIELDS_FRAGMENT } from "../../fragments/merchantPointsProgram";

export const SAVE_MERCHANT_POINTS_PROGRAM_MUTATION = gql`
  ${MERCHANT_POINTS_PROGRAM_FIELDS_FRAGMENT}
  mutation SaveMerchantPointsProgram(
    $merchantId: String!
    $data: UpsertMerchantPointsProgramInput!
  ) {
    saveMerchantPointsProgram(merchantId: $merchantId, data: $data) {
      ...MerchantPointsProgramFields
    }
  }
`;

export const ADD_MERCHANT_POINTS_MUTATION = gql`
  mutation AddMerchantPoints(
    $description: String!
    $amount: Float!
    $programId: String!
    $userId: String!
    $storeId: String!
  ) {
    addMerchantPoints(
      description: $description
      amount: $amount
      programId: $programId
      userId: $userId
      storeId: $storeId
    ) {
      id
      userId
      merchantId
      totalPoints
      availablePoints
      lockedPoints
      createdAt
      updatedAt
    }
  }
`;
