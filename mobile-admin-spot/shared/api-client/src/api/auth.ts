import { safeSetItem } from "@/utils/safeAsyncStorage";
import { updateTokenCache } from "../graphql/authTokenCache";
import { apiPost } from "./client";
import type {
  ApiResponse,
  GoogleLoginResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  VerifyCodeRequest,
} from "./types";

async function saveTokenFromResponse(data: any): Promise<void> {
  if (data?.token?.access_token) {
    const token = data.token.access_token;
    await safeSetItem("access_token", token);
    updateTokenCache(token);
  }
}

export async function loginUser(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiPost<LoginResponse>("/authorization/login", credentials);
  if (response.data) {
    await saveTokenFromResponse(response.data);
  }
  return response;
}

export async function signupUser(
  credentials: SignupRequest
): Promise<ApiResponse<SignupResponse>> {
  const response = await apiPost<SignupResponse>("/authorization/signup", credentials);
  if (response.data) {
    await saveTokenFromResponse(response.data);
  }
  return response;
}

export async function loginWithGoogleMobile(
  serverAuthCode: string
): Promise<ApiResponse<GoogleLoginResponse>> {
  const response = await apiPost<GoogleLoginResponse>("/authorization/login/google/mobile", {
    serverAuthCode,
  });
  if (response.data) {
    await saveTokenFromResponse(response.data);
  }
  return response;
}

export async function verifyCode(
  request: VerifyCodeRequest
): Promise<ApiResponse<any>> {
  const response = await apiPost<any>("/authorization/verify-code", request);
  if (response.data) {
    await saveTokenFromResponse(response.data);
  }
  return response;
}

export async function resendVerificationCode(
  email: string
): Promise<ApiResponse<any>> {
  return apiPost<any>("/authorization/resend-verification", { email });
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

export async function changePasswordLoggedIn(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>("/authorization/change-password", {
    currentPassword,
    newPassword,
  });
}

