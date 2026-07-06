import { apiPost } from "./client";
import type {
    ApiResponse,
    GoogleLoginResponse,
    LoginRequest,
    LoginResponse,
    PhoneSendCodeResponse,
    PhoneVerifyCodeResponse,
    SignupRequest,
    SignupResponse,
    VerifyCodeRequest
} from "./types";

export async function loginUser(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  return apiPost<LoginResponse>("/authorization/login", credentials);
}

export async function signupUser(
  credentials: SignupRequest
): Promise<ApiResponse<SignupResponse>> {
  return apiPost<SignupResponse>("/authorization/signup", credentials);
}

export async function loginWithGoogleMobile(
  serverAuthCode: string
): Promise<ApiResponse<GoogleLoginResponse>> {
  return apiPost<GoogleLoginResponse>("/authorization/login/google/mobile", {
    serverAuthCode,
  });
}

export async function sendPhoneCode(
  phoneNumber: string
): Promise<ApiResponse<PhoneSendCodeResponse>> {
  return apiPost<PhoneSendCodeResponse>("/authorization/phone/send-code", { phoneNumber });
}

export async function verifyPhoneCode(
  phoneNumber: string,
  code: string
): Promise<ApiResponse<PhoneVerifyCodeResponse>> {
  // Courier app: tag new phone signups so the backend assigns the COURIER role + profile.
  return apiPost<PhoneVerifyCodeResponse>("/authorization/phone/verify-code", {
    phoneNumber,
    code,
    registrationSource: "MOBILE_COURIER",
  });
}

export async function verifyCode(
  request: VerifyCodeRequest
): Promise<ApiResponse<any>> {
  return apiPost<any>("/authorization/verify-code", request);
}

export async function resendVerificationCode(
  email: string
): Promise<ApiResponse<any>> {
  // Courier app: scope the resend to the COURIER account namespace.
  return apiPost<any>("/authorization/resend-verification", {
    email,
    registrationSource: "MOBILE_COURIER",
  });
}

export async function requestPasswordResetCode(
  email: string
): Promise<ApiResponse<any>> {
  return apiPost<any>("/authorization/forgot-password-code", { email });
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): Promise<ApiResponse<any>> {
  return apiPost<any>("/authorization/reset-password-with-code", {
    email,
    code,
    newPassword,
  });
}
export async function updatePermissions(
  locationPermission: boolean,
  notificationPermission: boolean,
  preferredCity?: string
): Promise<any> {
  const { executeGraphQLQuery } = await import("../graphql/client");
  const { UPDATE_PERMISSIONS } = await import("./graphql-operations");

  const result = await executeGraphQLQuery(UPDATE_PERMISSIONS, {
    variables: {
      location: locationPermission,
      notification: notificationPermission,
      city: preferredCity,
    },
  });

  return result;
}
