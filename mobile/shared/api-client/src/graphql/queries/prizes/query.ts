import { gql } from '@apollo/client';

/**
 * Rewards are per brand (BRANDS_SPEC §5.2). A brand's catalog is
 * `BrandRewards` (queries/loyalty); there is no arg-less `prizes` call.
 */

// Brand fields every reward screen shows (BrandSummary).
export const REWARD_BRAND_FIELDS = gql`
  fragment RewardBrandFields on BrandSummary {
    id
    name
    logoUrl
    isActive
  }
`;

// A claimed reward (`PR-` code), any brand.
export const USER_PRIZE_FIELDS = gql`
  fragment UserPrizeFields on UserPrizeType {
    id
    brandId
    qrCode
    isRedeemed
    redeemedAt
    claimedAt
    validUntil
    isExpired
    isRedeemableNow
    brand {
      ...RewardBrandFields
    }
    redeemedAtSpot {
      id
      name
    }
    prize {
      id
      brandId
      title
      titleLocal
      description
      descriptionLocal
      imageUrl
      pointsCost
    }
  }
  ${REWARD_BRAND_FIELDS}
`;

// Single reward of the catalog (also archived ones and rewards of paused
// brands, so old links keep working).
export const PRIZE_DETAIL_QUERY = gql`
  query PrizeDetail($id: ID!) {
    prize(id: $id) {
      id
      brandId
      title
      titleLocal
      description
      descriptionLocal
      imageUrl
      pointsCost
      quantity
      claimed
      isActive
      archivedAt
      validFrom
      validUntil
      brand {
        ...RewardBrandFields
      }
    }
  }
  ${REWARD_BRAND_FIELDS}
`;

// The user's claimed rewards, newest first: every brand, or one.
export const MY_PRIZES_QUERY = gql`
  query MyPrizes($brandId: ID, $includeRedeemed: Boolean) {
    myPrizes(brandId: $brandId, includeRedeemed: $includeRedeemed) {
      ...UserPrizeFields
    }
  }
  ${USER_PRIZE_FIELDS}
`;

// One claimed reward (My reward screen).
export const MY_PRIZE_QUERY = gql`
  query MyPrize($id: ID!) {
    myPrize(id: $id) {
      ...UserPrizeFields
    }
  }
  ${USER_PRIZE_FIELDS}
`;
