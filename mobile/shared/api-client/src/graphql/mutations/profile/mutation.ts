import { gql } from '@apollo/client';

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($data: UserChangeInput!) {
    updateProfile(data: $data) {
      id
      email
      name
      firstName
      surname
      phone
      birthDate
      birthdayCompleted
      profilePicture
      roles
      language
      createdAt
      locationPermission
      notificationPermission
      preferredCityId
    }
  }
`;
