import { gql } from '@apollo/client';

export const WHO_AM_I_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      roles
      firstName
      surname
      phone
      phoneVerified
      birthDate
      birthdayCompleted
      profilePicture
      language
      preferredCityId
      preferredCity {
        id
        name
        nameLocal
      }
      locationPermission
      notificationPermission
    }
  }
`;
