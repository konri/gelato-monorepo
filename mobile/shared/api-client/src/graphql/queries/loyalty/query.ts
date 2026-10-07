import { gql } from '@apollo/client';

// Shared by every loyalty document (BRANDS_SPEC §5.2).
export const PROMOTION_FIELDS = gql`
  fragment PromotionFields on BrandPromotion {
    taskId
    brandId
    brandName
    title
    titleLocal
    description
    descriptionLocal
    multiplierPercent
    isActiveNow
    activeUntil
    nextStartsAt
    timezone
    windows {
      dayOfWeek
      startTime
      endTime
    }
    spotIds
    spotNames
    startsOn
    endsOn
    appliesToOrders
    appliesToTemplateAwards
  }
`;

export const WALLET_BRAND_FIELDS = gql`
  fragment WalletBrandFields on Brand {
    id
    name
    logoUrl
    description
    descriptionLocal
    isActive
    cityIds
    rewardCount
    birthdayBonusPoints
    referralBonusPoints
  }
`;

// My card / Rewards: every wallet the user has or could have, in server order.
export const LOYALTY_OVERVIEW_QUERY = gql`
  query LoyaltyOverview($cityId: ID, $fallbackCityId: ID) {
    me {
      id
      firstName
      loyaltyCode
      preferredCityId
      language
    }
    myLoyaltyOverview(cityId: $cityId, fallbackCityId: $fallbackCityId) {
      cityId
      city {
        id
        name
        nameLocal
      }
      defaultBrandId
      engagedBrandCount
      showPointsPicker
      showRewardsPicker
      wallets {
        hasWallet
        paused
        availablePoints
        totalPoints
        readyToPickUpCount
        affordableRewardCount
        inMyCity
        lastActivityAt
        pointsToNextReward
        brand {
          ...WalletBrandFields
        }
        nextReward {
          id
          title
          titleLocal
          imageUrl
          pointsCost
        }
        activePromotion {
          ...PromotionFields
        }
      }
      readyToPickUp {
        id
        brandId
        qrCode
        claimedAt
        validUntil
        isExpired
        isRedeemableNow
        brand {
          id
          name
          logoUrl
          isActive
        }
        prize {
          id
          title
          titleLocal
          imageUrl
          pointsCost
        }
      }
    }
  }
  ${WALLET_BRAND_FIELDS}
  ${PROMOTION_FIELDS}
`;

// Discovery: active brands with at least one active location in the city.
export const BRANDS_IN_CITY_QUERY = gql`
  query BrandsInCity($cityId: ID!) {
    brandsInCity(cityId: $cityId) {
      ...WalletBrandFields
      spotCount(cityId: $cityId)
      activePromotions {
        ...PromotionFields
      }
    }
  }
  ${WALLET_BRAND_FIELDS}
  ${PROMOTION_FIELDS}
`;

// Brand page.
export const BRAND_DETAIL_QUERY = gql`
  query BrandDetail($id: ID!) {
    brand(id: $id) {
      ...WalletBrandFields
      coverUrl
      cities {
        id
        name
        nameLocal
      }
      spots {
        id
        name
        address
        cityId
        latitude
        longitude
        logoUrl
        isActive
        openingHours
      }
      activePromotions {
        ...PromotionFields
      }
    }
  }
  ${WALLET_BRAND_FIELDS}
  ${PROMOTION_FIELDS}
`;

// One brand's reward catalog.
export const BRAND_REWARDS_QUERY = gql`
  query BrandRewards($brandId: ID!) {
    prizes(brandId: $brandId) {
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
    }
  }
`;

// A brand's name and logo (order tracking, deep links); null when the brand
// is paused (the client then reads the paused wallet of the overview).
export const BRAND_SUMMARY_QUERY = gql`
  query BrandSummary($id: ID!) {
    brand(id: $id) {
      id
      name
      logoUrl
      isActive
    }
  }
`;
