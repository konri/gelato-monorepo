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
      picture
      profileType
      gender
      roles
      language
      createdAt
      tokenVersion
      locationPermission
      notificationPermission
      preferredCity
    }
  }
`;
