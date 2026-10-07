import { gql } from '@apollo/client';

/** Shared selections (BRANDS_SPEC §3.4). Types live next to the documents that use them. */

export const CITY_FIELDS = gql`
  fragment CityFields on City {
    id
    name
    nameLocal
    country
    timezone
    isActive
    latitude
    longitude
  }
`;

export const BRAND_FIELDS = gql`
  fragment BrandFields on Brand {
    id
    name
    description
    descriptionLocal
    logoUrl
    coverUrl
    isActive
    cityIds
    cities {
      ...CityFields
    }
    rewardCount
    birthdayBonusPoints
    referralBonusPoints
  }
  ${CITY_FIELDS}
`;

export const BRAND_ADMIN_VIEW_FIELDS = gql`
  fragment BrandAdminViewFields on BrandAdminView {
    brand {
      ...BrandFields
    }
    settings {
      birthdayBonusEnabled
      birthdayBonusPoints
      referralBonusPoints
      fallbackPointsPerPln
      manualAwardCap
      staffDailyAwardCap
    }
    quota {
      maxSpots
      activeSpots
      remaining
      totalSpots
    }
    totalSpots
    staffCount
    billingNote
    createdAt
  }
  ${BRAND_FIELDS}
`;

export const ADMIN_SPOT_FIELDS = gql`
  fragment AdminSpotFields on SpotType {
    id
    name
    description
    address
    cityId
    city {
      id
      name
      nameLocal
    }
    latitude
    longitude
    phone
    email
    isActive
    brandId
    brand {
      id
      name
      logoUrl
      isActive
    }
    timezone
    deliveryEnabled
    deliveryRadiusKm
    deliveryFee
    freeDeliveryThreshold
    pickupEnabled
    onlinePaymentEnabled
    openingHours
    logoUrl
    coverUrl
    photos
    createdAt
  }
`;

export const STAFF_MEMBER_FIELDS = gql`
  fragment StaffMemberFields on StaffMember {
    id
    email
    name
    role
    kind
    brandId
    spotIds
    loginDisabled
    invitePending
    createdAt
  }
`;

export const PRIZE_FIELDS = gql`
  fragment PrizeFields on PrizeType {
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
    createdAt
    updatedAt
  }
`;

export const BRAND_TASK_FIELDS = gql`
  fragment BrandTaskFields on BrandTask {
    id
    brandId
    kind
    status
    title
    titleLocal
    description
    descriptionLocal
    multiplierPercent
    appliesToOrders
    appliesToTemplateAwards
    startsOn
    endsOn
    windows {
      dayOfWeek
      startTime
      endTime
    }
    spotIds
    timesApplied
    createdAt
    updatedAt
  }
`;
