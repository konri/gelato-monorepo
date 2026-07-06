export type UserProfileData = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  surname?: string;
  phone?: string;
  birthDate?: string;
  picture?: string;
  profileType: string;
  gender?: string;
  roles: string[];
  language?: string;
  createdAt: string;
  tokenVersion: number;
  locationPermission?: boolean;
  notificationPermission?: boolean;
  preferredCity?: string;
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
