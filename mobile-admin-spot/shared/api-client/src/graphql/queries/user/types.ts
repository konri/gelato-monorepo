export type UserData = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  firstName: string;
  surname: string;
  phone: string;
  birthDate: string;
  picture: string;
  profileType: string;
  language: string;
  locationPermission: boolean;
};

export type GetWhoAmIResponse = {
  whoAmI: UserData;
};

export type UserSearchResult = {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  surname?: string | null;
};

export type SearchUsersByEmailResponse = {
  searchUsersByEmail: UserSearchResult[];
};
