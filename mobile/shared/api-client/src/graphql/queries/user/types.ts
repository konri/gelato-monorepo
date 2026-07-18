import { ApolloServerConfig } from '../../types';

export type UserData = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  firstName: string;
  surname: string;
  loyaltyCode?: string | null;
  phone: string;
  birthDate: string;
  birthdayCompleted: boolean;
  profilePicture: string;
  language: string;
  preferredCityId: string | null;
  preferredCity?: {
    id: string;
    name: string;
    nameLocal?: { pl?: string; en?: string; ua?: string } | string | null;
  } | null;
  locationPermission: boolean;
  notificationPermission: boolean;
};

export type GetWhoAmIOptions = ApolloServerConfig;

export type GetWhoAmIResponse = {
  me: UserData;
};
