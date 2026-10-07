import { gql } from '@apollo/client';

// clientApp / appVersion let the server route and template pushes per build
// (BRANDS_SPEC §5.2): sent as 'client' and the app version.
export const REGISTER_DEVICE = gql`
  mutation RegisterDevice(
    $token: String!
    $platform: String!
    $deviceId: String!
    $clientApp: String
    $appVersion: String
  ) {
    registerFCMToken(
      token: $token
      platform: $platform
      deviceId: $deviceId
      clientApp: $clientApp
      appVersion: $appVersion
    )
  }
`;

// Logout: this device stops receiving the user's pushes (the row is
// deactivated server-side and the token leaves the FCM topics).
export const REMOVE_DEVICE = gql`
  mutation RemoveDevice($deviceId: String!) {
    removeFCMToken(deviceId: $deviceId)
  }
`;
