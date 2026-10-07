import { gql } from '@apollo/client';
import { PRIZE_FIELDS } from './fragments';
import type { LocalizedText } from './brands';

/** A reward of a brand (PrizeType). */
export type Prize = {
  id: string;
  brandId: string;
  title: string;
  titleLocal?: LocalizedText | null;
  description?: string | null;
  descriptionLocal?: LocalizedText | null;
  imageUrl?: string | null;
  pointsCost: number;
  /** null = unlimited. */
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
  /** Set when the reward was archived (deleted after it had been claimed). */
  archivedAt?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The brand's rewards for the console: disabled and archived ones included
 * (brandPrizes; PLATFORM passes the brand).
 */
export const ADMIN_PRIZES = gql`
  query AdminPrizes($brandId: ID, $includeArchived: Boolean = true) {
    brandPrizes(brandId: $brandId, includeArchived: $includeArchived) {
      ...PrizeFields
    }
  }
  ${PRIZE_FIELDS}
`;

/** Titles and descriptions go as the canonical text plus `{ pl, en, ua }`. Needs an active brand. */
export const CREATE_PRIZE = gql`
  mutation CreatePrize(
    $brandId: ID
    $title: String!
    $titleLocal: JSON
    $description: String
    $descriptionLocal: JSON
    $pointsCost: Int!
    $quantity: Int
    $isActive: Boolean
    $validFrom: DateTime
    $validUntil: DateTime
  ) {
    createPrize(
      brandId: $brandId
      title: $title
      titleLocal: $titleLocal
      description: $description
      descriptionLocal: $descriptionLocal
      pointsCost: $pointsCost
      quantity: $quantity
      isActive: $isActive
      validFrom: $validFrom
      validUntil: $validUntil
    ) {
      ...PrizeFields
    }
  }
  ${PRIZE_FIELDS}
`;

/**
 * Changed fields only: an omitted variable stays as it is; null clears
 * (quantity null = unlimited, imageUrl / dates null = removed). The quantity
 * can't drop below `claimed` (REWARD_QUANTITY_BELOW_CLAIMED).
 */
export const UPDATE_PRIZE = gql`
  mutation UpdatePrize(
    $id: ID!
    $title: String
    $titleLocal: JSON
    $description: String
    $descriptionLocal: JSON
    $imageUrl: String
    $pointsCost: Int
    $quantity: Int
    $isActive: Boolean
    $validFrom: DateTime
    $validUntil: DateTime
  ) {
    updatePrize(
      id: $id
      title: $title
      titleLocal: $titleLocal
      description: $description
      descriptionLocal: $descriptionLocal
      imageUrl: $imageUrl
      pointsCost: $pointsCost
      quantity: $quantity
      isActive: $isActive
      validFrom: $validFrom
      validUntil: $validUntil
    ) {
      ...PrizeFields
    }
  }
  ${PRIZE_FIELDS}
`;

/** Hard delete when never claimed; otherwise the server archives it (claimed codes stay redeemable). */
export const DELETE_PRIZE = gql`
  mutation DeletePrize($id: ID!) {
    deletePrize(id: $id)
  }
`;

export type PrizeStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export function prizeStatus(prize: Pick<Prize, 'isActive' | 'archivedAt'>): PrizeStatus {
  if (prize.archivedAt) return 'ARCHIVED';
  return prize.isActive ? 'ACTIVE' : 'DISABLED';
}
