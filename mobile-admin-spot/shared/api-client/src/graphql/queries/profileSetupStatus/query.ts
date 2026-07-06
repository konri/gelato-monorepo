import { gql } from "@apollo/client";

export const GET_PROFILE_SETUP_STATUS_QUERY = gql`
  query MyProfileSetupStatus {
    myProfileSetupStatus {
      currentStep
      completedSteps
      isCompleted
      hasCompany
      hasMerchant
      hasStore
      hasSubscription
      companyDraft
      merchantDraft
      storeDraft
    }
  }
`;
