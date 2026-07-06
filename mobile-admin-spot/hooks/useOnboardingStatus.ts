import { useProfileSetupStatus } from "@/hooks/graphql/queries/useProfileSetupStatus";

export type OnboardingStatus = {
  hasCompany: boolean;
  hasMerchant: boolean;
  hasStore: boolean;
  hasSubscription: boolean;
  isLoading: boolean;
  isComplete: boolean;
  isFirstOnboardingPointComplete: boolean;
  currentOnboardingPoint: number;
  refetch: () => void;
};

export const useOnboardingStatus = (): OnboardingStatus => {
  const {
    data: profileSetupData,
    loading: profileSetupLoading,
    refetch: refetchProfileSetup,
  } = useProfileSetupStatus();

  const status = profileSetupData?.myProfileSetupStatus;

  const hasCompany = status?.hasCompany ?? false;
  const hasMerchant = status?.hasMerchant ?? false;
  const hasStore = status?.hasStore ?? false;
  const hasSubscription = status?.hasSubscription ?? false;

  const firstThreeStepsComplete = hasCompany && hasMerchant && hasStore;
  const isFirstOnboardingPointComplete = firstThreeStepsComplete;
  const currentOnboardingPoint = isFirstOnboardingPointComplete ? 2 : 1;

  const isComplete = hasCompany && hasMerchant && hasStore;

  const refetch = async () => {
    await refetchProfileSetup();
  };

  return {
    hasCompany,
    hasMerchant,
    hasStore,
    hasSubscription,
    isLoading: profileSetupLoading,
    isComplete,
    isFirstOnboardingPointComplete,
    currentOnboardingPoint,
    refetch,
  };
};
