export type UserRole = 'NEW_USER' | 'ADMIN' | 'CLIENT';

export type ApiUser = {
  email: string;
  picture: string | null;
  roles: UserRole[];
  name: string;
  firstName: string;
  surname: string;
  profileType: 'local' | 'google' | 'apple';
  registrationSource?: string;
};

export type JwtPayload = {
  user: ApiUser;
  iat: number;
};

export type LoginFormInput = {
  email: string;
  password: string;
  redirectTo?: string;
};

export type RegisterFormInput = {
  email: string;
  password: string;
  redirectTo?: string;
};
