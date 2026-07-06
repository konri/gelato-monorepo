import { gql } from "@apollo/client";
import { REWARD_FIELDS_FRAGMENT } from "../../fragments/reward";

export const GET_MY_REWARDS_QUERY = gql`
  ${REWARD_FIELDS_FRAGMENT}
  query GetMyRewards($storeId: ID) {
    myRewards(storeId: $storeId) {
      ...RewardFields
    }
  }
`;

export const GET_AVAILABLE_MERCHANT_REWARDS_QUERY = gql`
  ${REWARD_FIELDS_FRAGMENT}
  query GetAvailableMerchantRewards(
    $merchantId: ID
    $sourceType: RewardSourceType
    $storeId: ID
  ) {
    availableRewards(
      merchantId: $merchantId
      sourceType: $sourceType
      storeId: $storeId
    ) {
      ...RewardFields
    }
  }
`;
