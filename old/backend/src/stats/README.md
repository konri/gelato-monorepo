# Stats API — moduł analityczny Easybons

Statystyki są dostępne **wyłącznie przez GraphQL**: zapytanie `merchantStatsBundle` (TypeGraphQL, `MerchantStatsResolver`). Jedno żądanie zwraca bloki: `users`, `cards`, `stamps`, `points`, `rewards`, `funnels`, `trends`, `locations`, `coupons`, `streaks` oraz metadane (analytics, delty itd. — zob. `graphql/MerchantStatsTypes.ts`).

Argumenty opcjonalne m.in.: `from`, `to`, `merchantId`, `storeId`, `storeIds`, `loyaltyCardTemplateId`, `streakProgramId`, `granularity` (`StatsTrendGranularity`: `day` \| `week` \| `month`), `compareMode`. Autoryzacja jak w reszcie API GraphQL (`@Authorized`: `ADMIN`, `OWNER`, `COOPERATOR`).

Integracja frontendu: **`src/stats/FRONTEND.md`**. Poniżej: opis pól poszczególnych bloków (te same kształty co podobiekty w bundle).

## Wspólne parametry zapytań

Resolver przyjmuje te same nazwy argumentów co wcześniej parametry query w REST:

| Parametr     | Typ          | Wymagany | Domyślna wartość | Opis                                                                                                               |
| ------------ | ------------ | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `from`       | ISO 8601 UTC | nie      | `now - 30 dni`   | Początek okna czasowego                                                                                            |
| `to`         | ISO 8601 UTC | nie      | `now`            | Koniec okna czasowego                                                                                              |
| `merchantId` | UUID         | zależy   | —                | Wymagany dla ADMIN. Dla OWNER/COOPERATOR z jednym merchantem — automatyczny. Przy wielu — wymagany.                |
| `storeId`    | UUID         | nie      | —                | Filtruje wyniki do konkretnego sklepu. Walidowany: musi należeć do merchanta i mieścić się w zakresie cooperatora. |

Aliasy: `fromDate` / `toDate` są akceptowane zamiennie.

### Kontekst sklepu (store scope)

Dane można filtrować na dwa sposoby:

1. **Automatyczny scope cooperatora** — cooperatorzy z `scopeMode = STORE_SCOPED` widzą dane tylko ze swoich sklepów.
2. **Jawny argument `storeId`** — dowolny operator (ADMIN, OWNER, COOPERATOR) może przekazać `storeId`, aby zobaczyć dane wyłącznie z wybranego sklepu.

Filtrowanie per store działa dla modeli posiadających pole `merchantStoreId`: `StampTransaction`, `MerchantPointTransaction`, `CouponUsage`, `StreakVisit`, `Order`. Modele bez tego pola (`LoyaltyStampCard`, `UserReward`, `Coupon`) zwracają dane na poziomie merchanta niezależnie od `storeId`.

Każdy response zawiera pole `storeScopeApplied: boolean` informujące, czy filtrowanie po sklepach było aktywne.

### Format odpowiedzi

Wszystkie odpowiedzi mają wspólny nagłówek:

```json
{
  "period": { "from": "2025-01-01T00:00:00.000Z", "to": "2025-01-31T23:59:59.999Z" },
  "merchantId": "uuid",
  "storeScopeApplied": false,
  ...
}
```

---

## Bloki danych (`merchantStatsBundle`)

### 1. `users` — statystyki użytkowników

Mierzy bazę klientów merchanta i ich zaangażowanie.

| Pole                                     | Typ    | Opis                                                                                                                         |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `distinctClientsWithStampCard`           | number | Unikalni klienci posiadający kartę lojalnościową u merchanta (all-time)                                                      |
| `distinctClientsActiveInPeriod`          | number | Unikalni klienci z jakąkolwiek aktywnością w oknie: pieczątka (EARNED), transakcja punktowa, użycie kuponu lub wizyta streak |
| `newLoyaltyCardsIssuedInPeriod`          | number | Nowe karty lojalnościowe wydane w oknie                                                                                      |
| `clientsWithFirstEverStampInPeriod`      | number | Klienci, których pierwsza pieczątka w historii programu (nie tylko okna) wypada w tym oknie                                  |
| `distinctClientsWithPointBalance`        | number | Klienci z saldem punktowym u merchanta (all-time)                                                                            |
| `distinctClientsWithCouponUsageInPeriod` | number | Unikalni klienci, którzy użyli kuponu w oknie                                                                                |
| `distinctClientsWithStreakVisitInPeriod` | number | Unikalni klienci z wizytą streak w oknie                                                                                     |

**Definicja „aktywny"**: UNION czterech źródeł — `StampTransaction(EARNED)`, `MerchantPointTransaction`, `CouponUsage`, `StreakVisit`. Klient musi mieć co najmniej jeden ruch w dowolnym z tych źródeł.

---

### 2. `cards` — statystyki kart lojalnościowych

Cykl życia karty: wydanie → zbieranie → ukończenie lub porzucenie.

| Pole                                  | Typ    | Opis                                                                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `loyaltyCardsTotal`                   | number | Łączna liczba kart u merchanta (all-time)                                                                |
| `loyaltyCardsActive`                  | number | Karty z `isActive = true`                                                                                |
| `loyaltyCardsCompleted`               | number | Karty ukończone: `usedAt IS NOT NULL` lub `stampsCollected >= stampsRequired`                            |
| `loyaltyCardsAbandonedPartial`        | number | Karty porzucone z postępem: `isActive = false`, `usedAt IS NULL`, `0 < stampsCollected < stampsRequired` |
| `loyaltyCardsIssuedInPeriod`          | number | Karty wydane w oknie                                                                                     |
| `loyaltyCardsCompletedInPeriod`       | number | Karty ukończone w oknie (wg `usedAt` lub `updatedAt` przy braku `usedAt`)                                |
| `averageStampsCollectedOnActiveCards` | number | Średnia liczba zebranych pieczątek na aktywnych kartach                                                  |

---

### 3. `stamps` — statystyki pieczątek

Agregaty z ledgera `StampTransaction` + milestone'y.

| Pole                                       | Typ    | Opis                                                                 |
| ------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `stampsEarnedTotalInPeriod`                | number | Suma jednostek pieczątek zdobytych (EARNED) w oknie                  |
| `stampEarnTransactionsInPeriod`            | number | Liczba transakcji EARNED w oknie                                     |
| `stampsUsedTotalInPeriod`                  | number | Suma jednostek pieczątek wykorzystanych (USED) w oknie               |
| `stampUsedTransactionsInPeriod`            | number | Liczba transakcji USED w oknie                                       |
| `stampsRefundedTotalInPeriod`              | number | Suma jednostek pieczątek zwróconych (REFUNDED) w oknie               |
| `distinctCardsWithEarnedStampInPeriod`     | number | Ile kart otrzymało co najmniej jedną nową pieczątkę w oknie          |
| `averageEarnedStampsPerActiveCardInPeriod` | number | Średnia zdobytych pieczątek na kartę z ruchem w oknie                |
| `milestonesClaimedInPeriod`                | number | Kamienie milowe odebrane (ClaimedMilestone) w oknie                  |
| `milestonesRedeemedInPeriod`               | number | Kamienie milowe zrealizowane (isRedeemed = true, redeemedAt w oknie) |

Wszystkie typy transakcji agregowane jednym zapytaniem SQL z `CASE WHEN`.

---

### 4. `points` — statystyki punktów

Dane z `MerchantPointTransaction` i `UserMerchantPointBalance`.

| Pole                                           | Typ    | Opis                                                                 |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `merchantPointsEarnedInPeriod`                 | number | Suma punktów EARNED w oknie                                          |
| `merchantPointsSpentInPeriod`                  | number | Suma punktów SPENT w oknie                                           |
| `merchantPointsRefundedInPeriod`               | number | Suma punktów REFUND w oknie                                          |
| `merchantPointsBonusInPeriod`                  | number | Suma punktów BONUS w oknie                                           |
| `merchantPointsPenaltyInPeriod`                | number | Suma punktów PENALTY w oknie                                         |
| `merchantPointLedgerRowsInPeriod`              | number | Łączna liczba wierszy ledgera w oknie                                |
| `distinctUsersWithMerchantPointLedgerInPeriod` | number | Unikalni użytkownicy z ruchem punktowym w oknie                      |
| `averageAvailablePointsPerBalance`             | number | Średnia dostępnych punktów na konto użytkownika (all-time snapshot)  |
| `totalAvailablePointsLiability`                | number | Suma wszystkich dostępnych punktów — zobowiązanie finansowe programu |
| `usersWithMerchantPointBalance`                | number | Użytkownicy z kontem punktowym u merchanta                           |

Wszystkie 5 typów transakcji (EARNED, SPENT, REFUND, BONUS, PENALTY) agregowane jednym zapytaniem.

---

### 5. `rewards` — statystyki nagród

Dane z `UserReward` (zunifikowany system nagród).

| Pole                              | Typ                      | Opis                                                                                                         |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `userRewardsCreatedInPeriod`      | number                   | Nagrody utworzone w oknie                                                                                    |
| `userRewardsByStatusInPeriod`     | `Record<string, number>` | Rozbicie po statusie: `AVAILABLE`, `CLAIMED`, `REDEEMED`, `EXPIRED`, `CANCELLED`                             |
| `userRewardsBySourceTypeInPeriod` | `Record<string, number>` | Rozbicie po źródle: `STAMP_MAIN`, `STAMP_MILESTONE`, `STREAK`, `COUPON`, `POINT_VOUCHER`, `MERCHANT_VOUCHER` |
| `userRewardsRedeemedInPeriod`     | number                   | Nagrody zrealizowane w oknie (wg `redeemedAt`)                                                               |
| `userRewardsClaimedInPeriod`      | number                   | Nagrody odebrane w oknie (wg `claimedAt`)                                                                    |
| `userRewardsExpiredInPeriod`      | number                   | Nagrody wygasłe w oknie (wg `expiresAt`)                                                                     |
| `topRewardsInPeriod`              | `TopRewardRow[]`         | Top 10 nagród w oknie wg liczby utworzeń. Każdy element: `{ rewardId, title, sourceType, count }`            |
| `redemptionRate`                  | number                   | Współczynnik realizacji: `redeemed / claimed` (0–1, zaokrąglony do 4 miejsc)                                 |

---

### 6. `funnels` — lejki i konwersje

Dwa lejki: kart lojalnościowych i kuponów.

#### Lejek kart lojalnościowych (all-time)

| Pole                                       | Typ    | Opis                          |
| ------------------------------------------ | ------ | ----------------------------- |
| `stampCardFunnel.cardsTotal`               | number | Łączna baza kart              |
| `stampCardFunnel.cardsWithAtLeastOneStamp` | number | Karty z ≥1 pieczątką          |
| `stampCardFunnel.cardsCompleted`           | number | Karty ukończone               |
| `stampCardFunnel.shareWithStamp`           | number | Udział kart z pieczątką (0–1) |
| `stampCardFunnel.shareCompleted`           | number | Udział kart ukończonych (0–1) |

#### Lejek kart — kohorta okna

| Pole                                                | Typ    | Opis                                                 |
| --------------------------------------------------- | ------ | ---------------------------------------------------- |
| `stampCardCohortFunnel.cardsIssuedInPeriod`         | number | Karty wydane w oknie                                 |
| `stampCardCohortFunnel.cardsWithFirstStampInPeriod` | number | Z nich: te, które dostały pierwszą pieczątkę w oknie |
| `stampCardCohortFunnel.shareWithFirstStampInPeriod` | number | Szybkość aktywacji kohorty (0–1)                     |

#### Lejek kuponów

| Pole                                      | Typ    | Opis                                   |
| ----------------------------------------- | ------ | -------------------------------------- |
| `couponFunnel.activeCouponsForMerchant`   | number | Aktywne kupony w ofercie               |
| `couponFunnel.userCouponsClaimedInPeriod` | number | UserCoupon utworzone (claim) w oknie   |
| `couponFunnel.couponUsagesInPeriod`       | number | CouponUsage (faktyczne użycie) w oknie |
| `couponFunnel.claimToUseRate`             | number | Konwersja claim → use (0–1)            |

---

### 7. `trends` — trendy czasowe

Dodatkowy argument: `granularity` — `day` \| `week` \| `month` (domyślnie `day`).

Odpowiedź zawiera tablicę `series`, gdzie każdy element to jeden bucket czasowy z 8 seriami:

| Pole w `TrendPoint`         | Opis                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `periodStart`               | ISO 8601 UTC — początek bucketu (wynik `date_trunc`)         |
| `loyaltyCardsCreated`       | Karty lojalnościowe utworzone w buckecie                     |
| `stampsEarnedUnits`         | Jednostki pieczątek EARNED w buckecie                        |
| `merchantPointsEarnedUnits` | Jednostki punktów EARNED w buckecie                          |
| `ordersCreated`             | Zamówienia utworzone w buckecie (respektuje store scope)     |
| `couponsClaimedByUsers`     | UserCoupon (claim) w buckecie                                |
| `couponUsages`              | CouponUsage (faktyczne użycie) w buckecie                    |
| `rewardsRedeemed`           | UserReward ze statusem REDEEMED w buckecie (wg `redeemedAt`) |
| `streakVisits`              | StreakVisit w buckecie                                       |

Serie są wyrównane — jeśli w danym buckecie nie ma danych jednej serii, jej wartość to `0`.

---

### 8. `locations` — statystyki per sklep

Tabela z metrykami per `MerchantStore`.

| Pole w `LocationMetricRow` | Typ            | Opis                                                      |
| -------------------------- | -------------- | --------------------------------------------------------- |
| `merchantStoreId`          | string         | ID sklepu                                                 |
| `storeName`                | string         | Nazwa sklepu                                              |
| `city`                     | string \| null | Miasto                                                    |
| `ordersCreatedInPeriod`    | number         | Zamówienia utworzone w oknie                              |
| `usersWhoFavoritedStore`   | number         | Użytkownicy, którzy dodali sklep do ulubionych (all-time) |

Respektuje store scope cooperatora.

---

### 9. `coupons` — statystyki kuponów

Pełna analityka systemu kuponowego.

| Pole                         | Typ                                     | Opis                                                                                                                                    |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `totalCouponsConfigured`     | number                                  | Łączna liczba kuponów u merchanta (all-time)                                                                                            |
| `activeCoupons`              | number                                  | Aktywne kupony (`isActive = true`)                                                                                                      |
| `userCouponsClaimedInPeriod` | number                                  | UserCoupon utworzone (claim) w oknie                                                                                                    |
| `userCouponsUsedInPeriod`    | number                                  | UserCoupon oznaczone jako użyte (`isUsed = true`, `usedAt` w oknie)                                                                     |
| `couponUsagesInPeriod`       | number                                  | CouponUsage (rejestracja użycia) w oknie                                                                                                |
| `distinctUsersWhoClaimed`    | number                                  | Unikalni użytkownicy, którzy odebrali kupon w oknie                                                                                     |
| `distinctUsersWhoUsed`       | number                                  | Unikalni użytkownicy, którzy użyli kuponu w oknie                                                                                       |
| `claimToUseRate`             | number                                  | Konwersja claim → use (0–1)                                                                                                             |
| `byTypeInPeriod`             | `Record<CouponType, { claimed, used }>` | Rozbicie po typie kuponu. Klucze: `MULTI_BUY`, `DISCOUNT`, `DAY_OF_WEEK`, `THRESHOLD_DISCOUNT`, `ITEM_SPECIFIC`, `BIRTHDAY`, `ACTIVITY` |
| `topCouponsByUsage`          | `TopCouponRow[]`                        | Top 10 kuponów wg użyć w oknie. Każdy element: `{ couponId, title, couponType, usageCount }`                                            |

---

### 10. `streaks` — statystyki streaków

Analityka programów streak (serie wizyt).

| Pole                             | Typ                  | Opis                                                             |
| -------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `activeStreakPrograms`           | number               | Aktywne programy streak (`isActive = true`, `deletedAt IS NULL`) |
| `totalVisitsInPeriod`            | number               | Łączna liczba wizyt streak w oknie                               |
| `distinctUsersWithVisitInPeriod` | number               | Unikalni użytkownicy z wizytą w oknie                            |
| `totalRewardClaimsInPeriod`      | number               | Nagrody odebrane z programów streak w oknie                      |
| `averageCurrentStreak`           | number               | Średnia bieżąca seria wśród wszystkich stanów użytkowników       |
| `averageLongestStreak`           | number               | Średnia najdłuższa seria w historii                              |
| `programBreakdown`               | `StreakProgramRow[]` | Rozbicie per program streak                                      |

Każdy element `programBreakdown`:

| Pole                    | Typ    | Opis                         |
| ----------------------- | ------ | ---------------------------- |
| `streakProgramId`       | string | ID programu                  |
| `name`                  | string | Nazwa programu               |
| `visitsInPeriod`        | number | Wizyty w oknie               |
| `distinctUsersInPeriod` | number | Unikalni użytkownicy w oknie |
| `rewardClaimsInPeriod`  | number | Odebrane nagrody w oknie     |

---

## Braki danych — wymagane rozszerzenia backendu

Poniższe metryki **nie mogą** być wyliczone z obecnego modelu danych. W plikach serwisów znajdują się komentarze `⚠️ [WYMAGA ROZSZERZENIA]` z dokładnym opisem.

| Brak                                                                             | Dotknięty blok / metryka                                    | Rozwiązanie                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| Brak `merchantStoreId` i `issuedByUserId` w `StampAuditLog` / `StampTransaction` | `stamps` — pieczątki per sklep i per pracownik              | Dodać pola w mutacji `addStampByUserId`                      |
| Brak `localTimezone` / `localCreatedAt` w `StampTransaction`                     | `stamps` — rozkład per godzina/dzień tygodnia               | Dodać pole w mutacji nabijającej pieczątkę                   |
| Brak tabeli `UserMerchantActivitySnapshot`                                       | `users` — churn, retencja D7/D30, segmentacja RFM           | Nowa tabela aktualizowana we wszystkich mutacjach aktywności |
| Brak `expiresAt` na `MerchantPointTransaction`                                   | `points` — punkty wygasłe/wygasające                        | Dodać pole + cron job                                        |
| Brak FK `stampCardId` na `UserReward`                                            | `rewards` — czas karta → pierwsza nagroda                   | Dodać FK lub dedykowany widok                                |
| Brak `campaignId` na `CouponUsage` i `StampTransaction`                          | `funnels` — atrybucja kampanii (kupon → wizyta → pieczątka) | Dodać opcjonalne pole                                        |
| Brak `merchantStoreId` na `CouponUsage`                                          | `coupons` — kupon per sklep                                 | Dodać pole w `useCouponByQr` / `useCoupon`                   |
| Brak `orderTotal` / `discountApplied` na `Order`                                 | `coupons` — ROI kuponu                                      | Dodać pola w `createOrder*`                                  |
| Brak `merchantStoreId` na `StreakVisit`                                          | `streaks` — streak per sklep                                | Dodać pole w `registerStreakVisit`                           |

---

## Architektura

```
src/stats/
├── graphql/
│   ├── MerchantStatsResolver.ts   # Query merchantStatsBundle
│   ├── MerchantStatsTypes.ts      # Typy GraphQL
│   └── merchantStatsBundleMapper.ts
├── utils/
│   ├── queryHelpers.ts            # firstString(), extractUser()
│   ├── statsDateRange.ts          # Parsowanie from/to → UTC Date
│   ├── statsContext.ts            # buildStatsRequestContext — merchantId, storeIds, compare
│   └── trendGranularity.ts        # Parsowanie granularity day|week|month
└── services/
    ├── usersStatsService.ts       # Baza klientów, UNION 4 źródeł aktywności
    ├── cardsStatsService.ts       # Cykl życia kart
    ├── stampsStatsService.ts      # Ledger pieczątek, milestones
    ├── pointsStatsService.ts      # Ledger punktów, 5 typów transakcji, liability
    ├── rewardsStatsService.ts     # UserReward: status, sourceType, top 10, redemptionRate
    ├── funnelsStatsService.ts     # Lejek kart + lejek kuponów
    ├── trendsStatsService.ts      # 8 serii × date_trunc(granularity)
    ├── locationsStatsService.ts   # Per store: zamówienia, ulubione
    ├── couponsStatsService.ts     # Lifecycle kuponów, byType, top 10
    ├── streaksStatsService.ts     # Wizyty, nagrody, avg streak, per program
    └── merchantStatsBundleService.ts  # Składanie bundle + delty
```

### Reużywane komponenty projektu

- `@Authorized` / `authChecker` — kontrola ról w GraphQL (jak w reszcie API)
- `MerchantAccessService` — rozwiązywanie scope'u operatora (OWNER vs COOPERATOR, FULL_MERCHANT vs STORE_SCOPED)
- `UserJWT` — typ użytkownika z JWT payload
- `ErrorWithStatus` — ustandaryzowane błędy HTTP
- `dayjs/utc` — parsowanie dat (używane w reszcie projektu)
- `Prisma.$queryRaw` — raw SQL z parametryzacją (bezpieczne przed SQL injection)

### Optymalizacje SQL

- Agregaty wielotypowe (stamps, points) wykonywane **jednym zapytaniem** z `CASE WHEN` zamiast N osobnych roundtrip'ów
- `COUNT(DISTINCT)` w SQL zamiast `findMany({ distinct })` + `.length` w Node.js
- Trends: 8 równoległych zapytań w `Promise.all`, merge po stronie Node'a
- Funnels: `EXISTS` subquery zamiast joina (PostgreSQL optimizer preferuje to przy sprawdzaniu istnienia)

---

## Podsumowanie: 75 metryk w 10 blokach bundle

| Blok        | Liczba pól           | Główne źródła danych                                                                                                  |
| ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `users`     | 7                    | LoyaltyStampCard, StampTransaction, MerchantPointTransaction, CouponUsage, StreakVisit, UserMerchantPointBalance      |
| `cards`     | 7                    | LoyaltyStampCard                                                                                                      |
| `stamps`    | 9                    | StampTransaction, LoyaltyStampCard, ClaimedMilestone                                                                  |
| `points`    | 10                   | MerchantPointTransaction, UserMerchantPointBalance                                                                    |
| `rewards`   | 8 + ranking + 2 mapy | UserReward                                                                                                            |
| `funnels`   | 12 (3 sekcje)        | LoyaltyStampCard, StampTransaction, Coupon, UserCoupon, CouponUsage                                                   |
| `trends`    | 8 serii × N bucketów | LoyaltyStampCard, StampTransaction, MerchantPointTransaction, Order, UserCoupon, CouponUsage, UserReward, StreakVisit |
| `locations` | 5 × N sklepów        | MerchantStore, Order, FavoriteStore                                                                                   |
| `coupons`   | 10 + mapa + ranking  | Coupon, UserCoupon, CouponUsage                                                                                       |
| `streaks`   | 6 + N programów      | StreakProgram, StreakVisit, StreakRewardClaim, UserStreakState                                                        |

---

## Integracja z frontendem

Szczegóły wywołań GraphQL, przykładowe zapytanie `merchantStatsBundle`, cache i obsługa błędów: **`src/stats/FRONTEND.md`**.

Typy pól odpowiedzi: **`src/stats/graphql/MerchantStatsTypes.ts`** (na froncie zalecany codegen z schematu GraphQL).
