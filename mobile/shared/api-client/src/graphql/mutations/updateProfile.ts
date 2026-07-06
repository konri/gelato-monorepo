import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($data: UserChangeInput!) {
    updateProfile(data: $data) {
      id
      name
      firstName
      surname
      phone
      birthDate
      picture
    }
  }
`;