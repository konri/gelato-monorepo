import type { ReactNode } from "react";

export type SignUpDetailsFormData = {
  firstName: string;
  surname: string;
  phone: string;
  birthDate: string;
  referralCode?: string;
};

export type SignUpDetailsFormProps = {
  remoteUri?: string | null;
  isFirstTimeLogin?: boolean;
  defaultValues?: Partial<SignUpDetailsFormData>;
  onSuccess?: () => void;
  showReferralCode?: boolean;
  successRoute?: string;
  submitButtonText?: string;
  footer?: ReactNode;
};
