import { gql } from '@apollo/client';

// A reward of the brand's catalog (PrizeType).
const REWARD_FIELDS = `
  id
  title
  titleLocal
  pointsCost
  imageUrl
  quantity
  claimed
  isActive
  validFrom
  validUntil
`;

// A reward claimed by a customer (UserPrizeType).
const USER_REWARD_FIELDS = `
  id
  qrCode
  claimedAt
  validUntil
  isExpired
  isRedeemed
  isRedeemableNow
  redeemedAt
  redeemedAtSpot {
    id
    name
  }
  prize {
    id
    title
    titleLocal
    pointsCost
    imageUrl
  }
`;

// The customer's card at the active spot's brand (LoyaltyCustomerType).
const CARD_FIELDS = `
  id
  name
  loyaltyCode
  profilePicture
  availablePoints
  totalPoints
  availablePrizes
  brandId
  brandName
  spotId
  readyToPickUpCount
  activeMultiplierPercent
  readyRewards {
    ${USER_REWARD_FIELDS}
  }
  affordableRewards {
    ${REWARD_FIELDS}
  }
`;

// What a scanned or typed code is at the spot: the server does all the
// parsing (QR JSON, Code 128, keyboard wedge, typed codes).
export const STAFF_SCAN_QUERY = gql`
  query StaffScan($spotId: ID!, $raw: String!) {
    staffScan(spotId: $spotId, raw: $raw) {
      kind
      normalizedCode
      reason
      rewardUsableHere
      reward {
        ${USER_REWARD_FIELDS}
      }
      customer {
        ${CARD_FIELDS}
      }
    }
  }
`;

export const BRAND_PRIZES_QUERY = gql`
  query BrandPrizes($brandId: ID) {
    brandPrizes(brandId: $brandId) {
      ${REWARD_FIELDS}
    }
  }
`;

export const BRAND_PROMOTIONS_QUERY = gql`
  query BrandPromotions($brandId: ID!, $spotId: ID) {
    brandPromotions(brandId: $brandId, spotId: $spotId) {
      taskId
      title
      titleLocal
      multiplierPercent
      isActiveNow
      activeUntil
      nextStartsAt
      appliesToOrders
      appliesToTemplateAwards
    }
  }
`;

export const AWARD_LOYALTY_POINTS_MUTATION = gql`
  mutation AwardLoyaltyPoints($input: AwardLoyaltyPointsInput!) {
    awardLoyaltyPoints(input: $input) {
      awardedPoints
      basePoints
      multiplierPercent
      brandAvailablePoints
      duplicate
      transactionId
      brand {
        id
        name
      }
    }
  }
`;

export const HAND_OVER_REWARD_MUTATION = gql`
  mutation HandOverReward($spotId: ID!, $userPrizeId: ID!, $customer: String!) {
    handOverReward(spotId: $spotId, userPrizeId: $userPrizeId, customer: $customer) {
      ${USER_REWARD_FIELDS}
    }
  }
`;

export const EXCHANGE_REWARD_AT_COUNTER_MUTATION = gql`
  mutation ExchangeRewardAtCounter($spotId: ID!, $customerId: ID!, $prizeId: ID!, $requestId: String!) {
    exchangeRewardAtCounter(spotId: $spotId, customerId: $customerId, prizeId: $prizeId, requestId: $requestId) {
      brandAvailablePoints
      brandId
      brandName
      duplicate
      pointsSpent
      transactionId
      userPrize {
        ${USER_REWARD_FIELDS}
      }
      customer {
        ${CARD_FIELDS}
      }
    }
  }
`;

// Hand over a reward from its PR code (after the staffScan preview).
export const VALIDATE_PRIZE_QR_MUTATION = gql`
  mutation ValidatePrizeQR($qrCode: String!, $spotId: ID!) {
    validatePrizeQR(qrCode: $qrCode, spotId: $spotId) {
      ${USER_REWARD_FIELDS}
    }
  }
`;

// The customer's open pickup orders at the brand's OTHER spots.
export const PICKUP_ORDERS_ELSEWHERE_QUERY = gql`
  query PickupOrdersElsewhere($spotId: ID!, $customer: String!) {
    pickupOrdersElsewhere(spotId: $spotId, customer: $customer) {
      orderId
      orderNumber
      spotId
      spotName
      spotAddress
    }
  }
`;
