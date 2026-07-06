import { gql } from "@apollo/client";

export const LOGOUT_ALL_DEVICES_MUTATION = gql`
  mutation LogoutAllDevices {
    logoutAllDevices
  }
`;
