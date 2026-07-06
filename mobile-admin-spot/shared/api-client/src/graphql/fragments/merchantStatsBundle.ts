import { gql } from "@apollo/client";

export const MERCHANT_STATS_BUNDLE_CORE_FIELDS = gql`
  fragment MerchantStatsBundleCoreFields on MerchantStatsBundle {
    users {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      distinctClientsWithStampCard
      distinctClientsActiveInPeriod
      returningClientsActiveInPeriod
      newClientsFirstActivityInPeriod
      clientsActiveWithoutActivitySnapshot
      newLoyaltyCardsIssuedInPeriod
      clientsWithFirstEverStampInPeriod
      distinctClientsWithPointBalance
      distinctClientsWithCouponUsageInPeriod
      distinctClientsWithStreakVisitInPeriod
    }
    cards {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      loyaltyCardsTotal
      loyaltyCardsActive
      loyaltyCardsCompleted
      loyaltyCardsAbandonedPartial
      loyaltyCardsIssuedInPeriod
      loyaltyCardsCompletedInPeriod
      averageStampsCollectedOnActiveCards
    }
    stamps {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      stampsEarnedTotalInPeriod
      stampEarnTransactionsInPeriod
      stampsUsedTotalInPeriod
      stampUsedTransactionsInPeriod
      stampsRefundedTotalInPeriod
      distinctCardsWithEarnedStampInPeriod
      averageEarnedStampsPerActiveCardInPeriod
      milestonesClaimedInPeriod
      milestonesRedeemedInPeriod
    }
    points {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      merchantPointsEarnedInPeriod
      merchantPointsSpentInPeriod
      merchantPointsRefundedInPeriod
      merchantPointsBonusInPeriod
      merchantPointsPenaltyInPeriod
      merchantPointLedgerRowsInPeriod
      distinctUsersWithMerchantPointLedgerInPeriod
      averageAvailablePointsPerBalance
      totalAvailablePointsLiability
      usersWithMerchantPointBalance
    }
    rewards {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      userRewardsCreatedInPeriod
      userRewardsByStatusInPeriod
      userRewardsBySourceTypeInPeriod
      userRewardsRedeemedInPeriod
      userRewardsClaimedInPeriod
      userRewardsExpiredInPeriod
      topRewardsInPeriod {
        rewardId
        title
        sourceType
        count
      }
      redemptionRate
    }
    funnels {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      stampCardFunnel {
        cardsTotal
        cardsWithAtLeastOneStamp
        cardsCompleted
        shareWithStamp
        shareCompleted
      }
      stampCardCohortFunnel {
        cardsIssuedInPeriod
        cardsWithFirstStampInPeriod
        shareWithFirstStampInPeriod
      }
      couponFunnel {
        activeCouponsForMerchant
        userCouponsClaimedInPeriod
        couponUsagesInPeriod
        claimToUseRate
      }
    }
    locations {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      locations {
        merchantStoreId
        storeName
        city
        ordersCreatedInPeriod
        usersWhoFavoritedStore
      }
    }
    coupons {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      totalCouponsConfigured
      activeCoupons
      userCouponsClaimedInPeriod
      userCouponsUsedInPeriod
      couponUsagesInPeriod
      distinctUsersWhoClaimed
      distinctUsersWhoUsed
      claimToUseRate
      byTypeInPeriod
      topCouponsByUsage {
        couponId
        title
        couponType
        usageCount
      }
    }
    streaks {
      period {
        from
        to
      }
      merchantId
      storeScopeApplied
      activeStreakPrograms
      totalVisitsInPeriod
      distinctUsersWithVisitInPeriod
      totalRewardClaimsInPeriod
      averageCurrentStreak
      averageLongestStreak
      programBreakdown {
        streakProgramId
        name
        visitsInPeriod
        distinctUsersInPeriod
        rewardClaimsInPeriod
      }
    }
  }
`;
