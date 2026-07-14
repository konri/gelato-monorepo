import { gql } from '@apollo/client';

export type Quest = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  pointsReward: number;
  isActive: boolean;
  isRepeatable: boolean;
  targetCityIds: string[];
};

export const QUESTS = gql`
  query AdminQuests {
    quests(includeInactive: true) {
      id
      type
      title
      description
      pointsReward
      isActive
      isRepeatable
      targetCityIds
    }
  }
`;

export const CREATE_QUEST = gql`
  mutation CreateQuest(
    $type: String!
    $title: String!
    $pointsReward: Int!
    $description: String
    $isRepeatable: Boolean
    $isActive: Boolean
    $targetCityIds: [String!]
  ) {
    createQuest(
      type: $type
      title: $title
      pointsReward: $pointsReward
      description: $description
      isRepeatable: $isRepeatable
      isActive: $isActive
      targetCityIds: $targetCityIds
    ) {
      id
      title
    }
  }
`;

export const UPDATE_QUEST = gql`
  mutation UpdateQuest(
    $id: ID!
    $title: String
    $description: String
    $pointsReward: Int
    $isRepeatable: Boolean
    $isActive: Boolean
  ) {
    updateQuest(
      id: $id
      title: $title
      description: $description
      pointsReward: $pointsReward
      isRepeatable: $isRepeatable
      isActive: $isActive
    ) {
      id
      isActive
    }
  }
`;

export const DELETE_QUEST = gql`
  mutation DeleteQuest($id: ID!) {
    deleteQuest(id: $id)
  }
`;
