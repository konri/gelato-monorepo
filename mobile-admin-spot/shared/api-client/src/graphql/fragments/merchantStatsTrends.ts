import { gql } from "@apollo/client";

export const STATS_ORDERS_TREND_FIELDS = gql`
  fragment StatsOrdersTrendFields on StatsOrdersTrends {
    period {
      from
      to
    }
    merchantId
    storeScopeApplied
    granularity
    series {
      periodStart
      ordersCreated
    }
  }
`;

export const STATS_STREAK_VISITS_TREND_FIELDS = gql`
  fragment StatsStreakVisitsTrendFields on StatsStreakVisitsTrends {
    period {
      from
      to
    }
    merchantId
    storeScopeApplied
    granularity
    series {
      periodStart
      streakVisits
    }
  }
`;
