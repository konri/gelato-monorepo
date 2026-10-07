import { User } from '@/shared/types';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
  // Machine-readable error code from the server body (`{ code, error }`),
  // e.g. INVALID_CREDENTIALS, RATE_LIMITED, UPGRADE_REQUIRED.
  code?: string;
  // Set by /login when the account exists but hasn't confirmed its emailed
  // OTP yet — lets the caller redirect to the verify-code screen instead of
  // just showing a generic error.
  requiresVerification?: boolean;
  email?: string;
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

export type AppleLoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
  isFirstTimeAppleLogin?: boolean;
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
