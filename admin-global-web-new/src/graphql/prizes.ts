import { gql } from '@apollo/client';

export type Prize = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  pointsCost: number;
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
};

export const PRIZES = gql`
  query AdminPrizes {
    prizes(includeInactive: true) {
      id
      title
      description
      imageUrl
      pointsCost
      quantity
      claimed
      isActive
    }
  }
`;

export const CREATE_PRIZE = gql`
  mutation CreatePrize(
    $title: String!
    $pointsCost: Int!
    $description: String
    $quantity: Int
    $isActive: Boolean
  ) {
    createPrize(
      title: $title
      pointsCost: $pointsCost
      description: $description
      quantity: $quantity
      isActive: $isActive
    ) {
      id
      title
    }
  }
`;

export const UPDATE_PRIZE = gql`
  mutation UpdatePrize(
    $id: ID!
    $title: String
    $description: String
    $pointsCost: Int
    $quantity: Int
    $isActive: Boolean
  ) {
    updatePrize(
      id: $id
      title: $title
      description: $description
      pointsCost: $pointsCost
      quantity: $quantity
      isActive: $isActive
    ) {
      id
      isActive
    }
  }
`;

export const DELETE_PRIZE = gql`
  mutation DeletePrize($id: ID!) {
    deletePrize(id: $id)
  }
`;
