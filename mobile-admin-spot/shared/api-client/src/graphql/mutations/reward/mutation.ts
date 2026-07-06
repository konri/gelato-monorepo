import { gql } from "@apollo/client";
import { REWARD_FIELDS_FRAGMENT } from "../../fragments/reward";

export const CREATE_REWARD_MUTATION = gql`
  ${REWARD_FIELDS_FRAGMENT}
  mutation CreateReward($data: CreateRewardInput!, $storeId: ID) {
    createReward(data: $data, storeId: $storeId) {
      ...RewardFields
    }
  }
`;

export const UPDATE_REWARD_MUTATION = gql`
  ${REWARD_FIELDS_FRAGMENT}
  mutation UpdateReward($data: CreateRewardInput!, $id: ID!) {
    updateReward(data: $data, id: $id) {
      ...RewardFields
    }
  }
`;

export const UPSERT_REWARD_STORE_OVERRIDE_MUTATION = gql`
  ${REWARD_FIELDS_FRAGMENT}
  mutation UpsertRewardStoreOverride(
    $rewardId: ID!
    $storeId: ID!
    $data: UpsertRewardStoreOverrideInput!
  ) {
    upsertRewardStoreOverride(rewardId: $rewardId, storeId: $storeId, data: $data) {
      ...RewardFields
    }
  }
`;

export const DELETE_REWARD_MUTATION = gql`
  mutation DeleteReward($id: ID!) {
    deleteReward(id: $id)
  }
`;
