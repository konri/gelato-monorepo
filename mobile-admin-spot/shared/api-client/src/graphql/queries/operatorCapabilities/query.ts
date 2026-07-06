import { gql } from "@apollo/client";

export const MY_OPERATOR_CAPABILITIES_QUERY = gql`
  query MyOperatorCapabilities {
    myOperatorCapabilities {
      roles
      isAdmin
      isOwner
      merchantScopes {
        merchantId
        scopeMode
        permissions
        storeScopeAll
        storeIds
        editCapabilities {
          canEditMerchantBaseConfig
          canEditCouponStoreOverrides
          canEditRewardStoreOverrides
          canEditStreakStoreOverrides
          canEditGlobalCoupons
          canEditGlobalRewards
          canEditMerchantProfile
          canEditGlobalStampTemplates
          canEditGlobalStreaks
          canEditMerchantPointsProgram
        }
      }
    }
  }
`;
