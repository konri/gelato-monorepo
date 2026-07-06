import { ApolloServerConfig } from '../../types';

export type UserProfileData = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  surname?: string;
  phone?: string;
  birthDate?: string;
  birthdayCompleted?: boolean;
  profilePicture?: string;
  roles: string[];
  language?: string;
  createdAt: string;
  locationPermission?: boolean;
  notificationPermission?: boolean;
  preferredCityId?: string;
};

export type UpdateProfileInput = {
  firstName?: string;
  surname?: string;
  name?: string;
  phone?: string;
  birthDate?: string;
  picture?: string;
  referralCode?: string;
};

export type UpdateProfileResponse = {
  updateProfile: UserProfileData;
};

export type UpdateProfileOptions = ApolloServerConfig & {
  data: UpdateProfileInput;
};
