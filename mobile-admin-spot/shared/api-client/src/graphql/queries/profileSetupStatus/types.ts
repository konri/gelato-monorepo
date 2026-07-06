export type ProfileSetupStep =
  | "COMPANY"
  | "MERCHANT"
  | "STORE"
  | "SUBSCRIPTION"
  | "COMPLETED";

export type ProfileSetupStatus = {
  currentStep: ProfileSetupStep;
  completedSteps: ProfileSetupStep[];
  isCompleted: boolean;
  hasCompany: boolean;
  hasMerchant: boolean;
  hasStore: boolean;
  hasSubscription: boolean;
  companyDraft?: Record<string, any> | null;
  merchantDraft?: Record<string, any> | null;
  storeDraft?: Record<string, any> | null;
};

export type GetProfileSetupStatusResponse = {
  myProfileSetupStatus: ProfileSetupStatus;
};
