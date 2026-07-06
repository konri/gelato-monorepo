import { router } from "expo-router";
import { safeRemoveItem, safeSetItem } from "@/utils/safeAsyncStorage";
import {
  PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY,
  PENDING_VERIFICATION_EMAIL_KEY,
} from "@/utils/verificationStorageKeys";

export const LOGIN_VERIFY_REDIRECT_FORM_SENTINEL = Object.freeze({
  __loginVerifyRedirect: true,
});

export function isLoginVerifyRedirectFormSentinel(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (!("__loginVerifyRedirect" in error)) {
    return false;
  }
  return Reflect.get(error, "__loginVerifyRedirect") === true;
}

export function readHttpStatusFromOwnedErrorProperty(
  error: unknown,
): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(error, "status");
  const value = desc?.value;
  return typeof value === "number" ? value : undefined;
}

export function isRestLoginEmailNotVerifiedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (readHttpStatusFromOwnedErrorProperty(error) !== 403) {
    return false;
  }
  return /not\s+verified/i.test(error.message);
}

export async function persistPendingVerificationEmail(
  email: string,
  options: { allowImmediateResend: boolean },
): Promise<void> {
  await safeSetItem(PENDING_VERIFICATION_EMAIL_KEY, email.trim());
  if (options.allowImmediateResend) {
    await safeSetItem(PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY, "true");
  } else {
    await safeRemoveItem(PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY);
  }
}

export async function persistAndNavigateToVerifyCodeAfterLoginUnverified(
  email: string,
): Promise<void> {
  await persistPendingVerificationEmail(email, { allowImmediateResend: true });
  router.push("/verify-code");
}
