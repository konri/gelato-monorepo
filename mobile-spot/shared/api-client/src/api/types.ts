import { User } from '@/shared/types';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export type LoginRequest = {
  email: string;
  password: string;
  loginContext: 'MOBILE_CLIENT' | 'MOBILE_COURIER' | 'ADMIN_WEB';
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  registrationSource: 'MOBILE_CLIENT' | 'MOBILE_COURIER';
  referralCode?: string;
};

export type VerifyCodeRequest = {
  email: string;
  code: string;
  registrationSource?: 'MOBILE_CLIENT' | 'MOBILE_COURIER';
};

export type LoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
};

export type SignupResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
};

export type GoogleLoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
  isFirstTimeGoogleLogin?: boolean;
};

export type PhoneSendCodeResponse = {
  success: boolean;
  message: string;
};

export type PhoneVerifyCodeResponse = {
  success: boolean;
  isNewUser: boolean;
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
};
