import { User } from '@repo/types';

export const AUTH_ERROR_CODE = {
  EMAIL_EXISTS_UNVERIFIED: 'EMAIL_EXISTS_UNVERIFIED',
  EMAIL_EXISTS_VERIFIED: 'EMAIL_EXISTS_VERIFIED',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
  errorCode?: AuthErrorCode;
};

export type LoginRequest = {
  email: string;
  password: string;
  loginContext: 'MOBILE_CLIENT';
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  registrationSource: 'MOBILE_CLIENT';
  referralCode?: string;
};

export type VerifyCodeRequest = {
  email: string;
  code: string;
};

export type LoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  user: User;
};

export type SignupResponse = {
  token: {
    access_token: string;
    type: string;
  };
  user: User;
};

export type GoogleLoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  user: User;
  isFirstTimeGoogleLogin?: boolean;
};
