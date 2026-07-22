import { gql } from '@apollo/client';

// The current courier's spot applications (pending / approved / rejected), newest first.
export const MY_COURIER_APPLICATIONS_QUERY = gql`
  query MyCourierApplications {
    myCourierApplications {
      id
      spotId
      status
      appliedAt
      reviewedAt
      spotName
      spotAddress
      cityName
    }
  }
`;

// Apply to work at a spot; returns the created (pending) application.
export const APPLY_COURIER_TO_SPOT_MUTATION = gql`
  mutation ApplyCourierToSpot($spotId: ID!) {
    applyCourierToSpot(spotId: $spotId) {
      id
      spotId
      status
      appliedAt
      spotName
      spotAddress
      cityName
    }
  }
`;

// Spots the courier is approved to work at (for the go-online spot picker).
export const MY_APPROVED_SPOTS_QUERY = gql`
  query MyApprovedSpots {
    myApprovedSpots {
      spotId
      spotName
      spotAddress
      cityName
      isActive
    }
  }
`;

// The courier's currently-active work session (null if offline).
export const MY_ACTIVE_WORK_SESSION_QUERY = gql`
  query MyActiveWorkSession {
    myActiveWorkSession {
      id
      courierId
      selectedSpotIds
      startedAt
      endedAt
    }
  }
`;

// Go online for the selected approved spots; returns the new session.
export const START_WORK_SESSION_MUTATION = gql`
  mutation StartWorkSession($spotIds: [ID!]!) {
    startWorkSession(spotIds: $spotIds) {
      id
      courierId
      selectedSpotIds
      startedAt
      endedAt
    }
  }
`;

// Go offline; closes the active session.
export const END_WORK_SESSION_MUTATION = gql`
  mutation EndWorkSession {
    endWorkSession
  }
`;

// Shared delivery fields (pool + active delivery).
const DELIVERY_FIELDS = `
  id
  orderNumber
  status
  total
  payout
  itemCount
  spotId
  spotName
  spotAddress
  spotLatitude
  spotLongitude
  deliveryAddress
  deliveryLatitude
  deliveryLongitude
  apartmentNumber
  floor
  noteForCourier
  distanceKm
  readyAt
  pickedUpAt
  deliveredAt
  courierRating
  reviewComment
`;

// Deliveries currently offered to the courier (READY, unassigned, at my spots).
export const AVAILABLE_DELIVERIES_QUERY = gql`
  query AvailableDeliveries {
    availableDeliveries {
      ${DELIVERY_FIELDS}
    }
  }
`;

// The courier's current in-progress delivery (null if none).
export const MY_ACTIVE_DELIVERY_QUERY = gql`
  query MyActiveDelivery {
    myActiveDelivery {
      ${DELIVERY_FIELDS}
    }
  }
`;

// The courier's completed deliveries (history tab), newest first.
export const MY_DELIVERY_HISTORY_QUERY = gql`
  query MyDeliveryHistory($limit: Int) {
    myDeliveryHistory(limit: $limit) {
      ${DELIVERY_FIELDS}
    }
  }
`;

// The courier's own profile (stats: total deliveries + average rating).
export const COURIER_PROFILE_QUERY = gql`
  query CourierProfile {
    courierProfile {
      id
      totalDeliveries
      averageRating
      totalEarnings
    }
  }
`;

// Earnings dashboard: today + month totals, all-time total, per-day breakdown.
export const MY_EARNINGS_QUERY = gql`
  query MyEarnings($days: Int) {
    myEarnings(days: $days) {
      todayAmount
      todayDeliveries
      monthAmount
      monthDeliveries
      totalAmount
      daily {
        date
        amount
        deliveries
      }
    }
  }
`;

// Accept a broadcast delivery (first-to-accept).
export const ACCEPT_DELIVERY_MUTATION = gql`
  mutation AcceptDelivery($orderId: ID!) {
    acceptDelivery(orderId: $orderId) {
      ${DELIVERY_FIELDS}
    }
  }
`;

// Courier updates delivery lifecycle status (PICKED_UP, IN_TRANSIT, DELIVERED).
// `code` = spot pickup code for PICKED_UP, client 4-digit PIN for DELIVERED.
export const UPDATE_DELIVERY_STATUS_MUTATION = gql`
  mutation UpdateDeliveryStatus($orderId: ID!, $status: OrderStatus!, $code: String) {
    updateDeliveryStatus(orderId: $orderId, status: $status, code: $code)
  }
`;

// Courier reports an incident (and, by default, cancels the delivery so the
// spot can reassign). photoUrl comes from POST /upload/delivery-incident/:id.
export const REPORT_DELIVERY_INCIDENT_MUTATION = gql`
  mutation ReportDeliveryIncident(
    $orderId: ID!
    $incidentType: String!
    $note: String
    $photoUrl: String
    $cancel: Boolean
  ) {
    reportDeliveryIncident(
      orderId: $orderId
      incidentType: $incidentType
      note: $note
      photoUrl: $photoUrl
      cancel: $cancel
    )
  }
`;

// Battery-friendly GPS ping (every ~60s while on an active delivery).
export const UPDATE_COURIER_LOCATION_MUTATION = gql`
  mutation UpdateCourierLocation(
    $latitude: Float!
    $longitude: Float!
    $accuracy: Float
    $orderId: ID
  ) {
    updateCourierLocation(
      latitude: $latitude
      longitude: $longitude
      accuracy: $accuracy
      orderId: $orderId
    )
  }
`;
