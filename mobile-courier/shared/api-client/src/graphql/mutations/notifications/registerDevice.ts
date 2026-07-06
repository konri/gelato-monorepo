import { gql } from '@apollo/client';

export const REGISTER_DEVICE = gql`
  mutation RegisterDevice(
    $token: String!
    $platform: String!
    $deviceId: String!
  ) {
    registerFCMToken(token: $token, platform: $platform, deviceId: $deviceId)
  }
`;
