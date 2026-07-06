# Integracja dashboardu statystyk (frontend)

## GraphQL

1. **`merchantStatsBundle`** — bloki metryk: `users`, `cards`, `stamps`, `points`, `rewards`, `funnels`, `locations`, `coupons`, `streaks` oraz `analytics` (okresy, `compareMode`, `metricDeltas`, echo filtrów itd.) i opcjonalnie zagnieżdżone `comparison` (bez `analytics` / `comparison`).

2. **`merchantStatsTrendOrders`** — szereg czasowy **zamówień**: `MerchantStatsOrdersTrendsResult` → `primary` / `comparison` typu `StatsOrdersTrends` (`series[].periodStart`, `series[].ordersCreated`).

3. **`merchantStatsTrendStreakVisits`** — szereg czasowy **wizyt streak**: `MerchantStatsStreakVisitsTrendsResult` → `primary` / `comparison` typu `StatsStreakVisitsTrends` (`series[].periodStart`, `series[].streakVisits`).

Wspólne argumenty filtrów (opcjonalne): `from`, `to`, `merchantId`, `storeId`, `storeIds`, `loyaltyCardTemplateId`, `streakProgramId`, `compareMode`. Dla obu query trendów dodatkowo wymagane **`granularity`** (`day` | `week` | `month`). Aliasy dat: `fromDate` / `toDate`.

Agregacja bucketów: **Prisma** + grupowanie UTC (`startOfTrendBucketUtc`).

Autoryzacja: `Authorization: Bearer <jwt>`, role `ADMIN` | `OWNER` | `COOPERATOR`.

### Przykład: bundle + oba trendy

```graphql
query MerchantStatsTrendOrders($granularity: StatsTrendGranularity!, $compareMode: StatsCompareMode) {
  merchantStatsTrendOrders(granularity: $granularity, compareMode: $compareMode) {
    primary {
      granularity
      series {
        periodStart
        ordersCreated
      }
    }
    comparison {
      series {
        periodStart
        ordersCreated
      }
    }
  }
}

query MerchantStatsTrendStreakVisits($granularity: StatsTrendGranularity!, $compareMode: StatsCompareMode) {
  merchantStatsTrendStreakVisits(granularity: $granularity, compareMode: $compareMode) {
    primary {
      granularity
      series {
        periodStart
        streakVisits
      }
    }
    comparison {
      series {
        periodStart
        streakVisits
      }
    }
  }
}
```

## Mapowanie bloków na widgety

| Widget          | Źródło                           | Pole / query             |
| --------------- | -------------------------------- | ------------------------ |
| Wykres zamówień | `merchantStatsTrendOrders`       | `primary` / `comparison` |
| Wykres streak   | `merchantStatsTrendStreakVisits` | `primary` / `comparison` |
| Pozostałe KPI   | `merchantStatsBundle`            | odpowiednie bloki        |

## Ładowanie danych

- Równolegle **`merchantStatsBundle`**, **`merchantStatsTrendOrders`**, **`merchantStatsTrendStreakVisits`** z tymi samymi filtrami i `compareMode`.
- Zmiana **`granularity`** → ponów tylko **oba** query trendów (bundle bez zmian).

## Błędy

GraphQL: standardowe `errors[]`. Walidacja z resolvera (`ErrorWithStatus`).

## Cache

Osobne `keyArgs` dla każdego pola `Query` (data, sklepy, `granularity`, `compareMode`).
