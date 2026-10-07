import { gql } from '@apollo/client';

// One accessible spot with the caller's level and the switcher counters.
const STAFF_SPOT_FIELDS = gql`
  fragment StaffSpotFields on StaffSpot {
    spotId
    brandId
    brandName
    brandLogoUrl
    level
    isActive
    pendingOrderCount
    myOpenClaimedCount
    staffCount
    manualAwardCap
    spot {
      id
      name
      address
      logoUrl
      cityId
      city {
        id
        name
        nameLocal
      }
      brand {
        id
        name
        logoUrl
        isActive
      }
    }
  }
`;

// The staff member's context: scope, brand, every accessible spot (inactive
// ones flagged; PLATFORM gets active spots only) and the last-used spot.
// Works in a restricted (must-change-password) session.
export const MY_STAFF_CONTEXT_QUERY = gql`
  query MyStaffContext {
    myStaffContext {
      scope
      canManageBrand
      mustChangePassword
      defaultSpotId
      brand {
        id
        name
        logoUrl
        isActive
      }
      spots {
        ...StaffSpotFields
      }
    }
  }
  ${STAFF_SPOT_FIELDS}
`;

// Counters only (polled every 30 s by the switcher while in the foreground).
export const MY_STAFF_SPOTS_QUERY = gql`
  query MyStaffSpots($includeInactive: Boolean, $limit: Int) {
    myStaffSpots(includeInactive: $includeInactive, limit: $limit) {
      spotId
      level
      isActive
      pendingOrderCount
      myOpenClaimedCount
      staffCount
      manualAwardCap
    }
  }
`;

// Pins this device to the spot (push routing) and records a SPOT_SWITCH row.
export const SELECT_ACTIVE_SPOT_MUTATION = gql`
  mutation SelectActiveSpot($spotId: ID!, $deviceId: String) {
    selectActiveSpot(spotId: $spotId, deviceId: $deviceId) {
      spotId
      pendingOrderCount
      myOpenClaimedCount
    }
  }
`;
