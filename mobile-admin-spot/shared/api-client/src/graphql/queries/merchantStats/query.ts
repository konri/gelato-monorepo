import { gql } from "@apollo/client";

import { MERCHANT_STATS_BUNDLE_CORE_FIELDS } from "../../fragments/merchantStatsBundle";
import {
  STATS_ORDERS_TREND_FIELDS,
  STATS_STREAK_VISITS_TREND_FIELDS,
} from "../../fragments/merchantStatsTrends";

export const MERCHANT_STATS_BUNDLE_QUERY = gql`
  ${MERCHANT_STATS_BUNDLE_CORE_FIELDS}
  query MerchantStatsBundle(
    $from: String
    $to: String
    $merchantId: String
    $storeId: String
    $storeIds: [String!]
    $loyaltyCardTemplateId: String
    $streakProgramId: String
    $compareMode: StatsCompareMode
  ) {
    merchantStatsBundle(
      from: $from
      to: $to
      merchantId: $merchantId
      storeId: $storeId
      storeIds: $storeIds
      loyaltyCardTemplateId: $loyaltyCardTemplateId
      streakProgramId: $streakProgramId
      compareMode: $compareMode
    ) {
      ...MerchantStatsBundleCoreFields
      analytics {
        generatedAt
        compareMode
        primaryPeriod {
          from
          to
        }
        comparisonPeriod {
          from
          to
        }
        filtersEcho
        storeMetricCoverage
        dataScopeNotes
        metricDeltas {
          path
          current
          previous
          delta
          deltaPct
        }
      }
      comparison {
        ...MerchantStatsBundleCoreFields
      }
    }
  }
`;

export const MERCHANT_STATS_TREND_ORDERS_QUERY = gql`
  ${STATS_ORDERS_TREND_FIELDS}
  query MerchantStatsTrendOrders(
    $from: String
    $to: String
    $merchantId: String
    $storeId: String
    $storeIds: [String!]
    $loyaltyCardTemplateId: String
    $streakProgramId: String
    $compareMode: StatsCompareMode
    $granularity: StatsTrendGranularity!
  ) {
    merchantStatsTrendOrders(
      from: $from
      to: $to
      merchantId: $merchantId
      storeId: $storeId
      storeIds: $storeIds
      loyaltyCardTemplateId: $loyaltyCardTemplateId
      streakProgramId: $streakProgramId
      compareMode: $compareMode
      granularity: $granularity
    ) {
      primary {
        ...StatsOrdersTrendFields
      }
      comparison {
        ...StatsOrdersTrendFields
      }
    }
  }
`;

export const MERCHANT_STATS_TREND_STREAK_VISITS_QUERY = gql`
  ${STATS_STREAK_VISITS_TREND_FIELDS}
  query MerchantStatsTrendStreakVisits(
    $from: String
    $to: String
    $merchantId: String
    $storeId: String
    $storeIds: [String!]
    $loyaltyCardTemplateId: String
    $streakProgramId: String
    $compareMode: StatsCompareMode
    $granularity: StatsTrendGranularity!
  ) {
    merchantStatsTrendStreakVisits(
      from: $from
      to: $to
      merchantId: $merchantId
      storeId: $storeId
      storeIds: $storeIds
      loyaltyCardTemplateId: $loyaltyCardTemplateId
      streakProgramId: $streakProgramId
      compareMode: $compareMode
      granularity: $granularity
    ) {
      primary {
        ...StatsStreakVisitsTrendFields
      }
      comparison {
        ...StatsStreakVisitsTrendFields
      }
    }
  }
`;
