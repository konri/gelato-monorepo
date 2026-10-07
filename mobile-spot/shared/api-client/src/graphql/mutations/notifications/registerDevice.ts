import { gql } from '@apollo/client';

// `deviceId` is the stable install id (utils/deviceId.ts). `activeSpotId` pins
// staff pushes to the spot this device works at (BRANDS_SPEC §2.10, §4.6).
export const REGISTER_DEVICE = gql`
  mutation RegisterDevice(
    $token: String!
    $platform: String!
    $deviceId: String!
    $clientApp: String
    $appVersion: String
    $activeSpotId: ID
  ) {
    registerFCMToken(
      token: $token
      platform: $platform
      deviceId: $deviceId
      clientApp: $clientApp
      appVersion: $appVersion
      activeSpotId: $activeSpotId
    )
  }
`;
