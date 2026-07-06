import { gql } from '@apollo/client';

export const UPDATE_PERMISSIONS = gql`
  mutation UpdatePermissions($location: Boolean, $notification: Boolean, $city: String) {
    updatePermissions(locationPermission: $location, notificationPermission: $notification, preferredCity: $city) {
      id
      locationPermission
      notificationPermission
      preferredCity
    }
  }
`;