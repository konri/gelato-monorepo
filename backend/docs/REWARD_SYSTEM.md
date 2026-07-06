# Universal Reward System

## Overview

System uniwersalnych nagród pozwala na tworzenie reużywalnych obiektów nagród, które mogą być podpinane do różnych miejsc w aplikacji (pieczątki, kupony, punkty, subskrypcje).

## Reward Model

### Typy źródeł nagród (RewardSourceType)

- `STAMP_CARD` - nagrody za pieczątki
- `POINTS` - nagrody za punkty
- `CASH` - nagrody za gotówkę z dopłatą
- `SUBSCRIPTION` - nagrody za subskrypcję
- `REFERRAL` - nagrody za polecenia
- `ACTIVITY` - nagrody za aktywność

### Typy wartości nagród (RewardValueType)

- `FREE_SERVICE` - darmowa usługa
- `DISCOUNT_PERCENT` - zniżka procentowa
- `DISCOUNT_AMOUNT` - zniżka kwotowa
- `PRODUCT` - konkretny produkt
- `POINTS` - punkty do wykorzystania
- `CASH_VOUCHER` - voucher gotówkowy

## GraphQL API

### Queries

#### myRewards (OWNER/COOPERATOR/ADMIN)

Pobiera nagrody merchanta zalogowanego użytkownika.

```graphql
query {
  myRewards {
    id
    title
    description
    sourceType
    valueType
    discountPercent
    discountAmount
    pointsValue
    merchant {
      name
    }
  }
}
```

#### availableRewards

Pobiera dostępne nagrody z opcjonalnym filtrowaniem.

```graphql
query {
  availableRewards(merchantId: "merchant-id", sourceType: STAMP_CARD) {
    id
    title
    valueType
    discountPercent
  }
}
```

#### reward

Pobiera szczegóły konkretnej nagrody.

```graphql
query {
  reward(id: "reward-id") {
    id
    title
    description
    valueType
  }
}
```

### Mutations

#### createReward (OWNER/COOPERATOR/ADMIN)

Tworzy nową nagrodę.

```graphql
mutation {
  createReward(
    data: {
      title: "20% zniżki na kawę"
      description: "Zniżka na wszystkie kawy"
      sourceType: STAMP_CARD
      valueType: DISCOUNT_PERCENT
      discountPercent: 20
      validFrom: "2024-01-01T00:00:00Z"
      validUntil: "2024-12-31T23:59:59Z"
    }
  ) {
    id
    title
  }
}
```

#### updateReward (OWNER/COOPERATOR/ADMIN)

Aktualizuje istniejącą nagrodę.

```graphql
mutation {
  updateReward(id: "reward-id", data: { title: "30% zniżki na kawę", discountPercent: 30 }) {
    id
    title
  }
}
```

#### deleteReward (OWNER/COOPERATOR/ADMIN)

Usuwa nagrodę (tylko jeśli nie jest używana).

```graphql
mutation {
  deleteReward(id: "reward-id")
}
```

## Integracja z istniejącymi systemami

### 1. Stamp Card Templates

Podpinanie nagrody do szablonu karty pieczątek:

```graphql
mutation {
  createStampCardTemplate(
    data: {
      merchantId: "merchant-id"
      title: "Karta Kawy"
      stampsRequired: 10
      rewardId: "reward-id" # Nowe pole!
    }
  ) {
    id
    title
    reward {
      title
      valueType
      discountPercent
    }
  }
}
```

**Legacy support**: Stare pola (rewardTitle, rewardDescription, rewardDiscountPercent) nadal działają dla kompatybilności wstecznej.

### 2. Stamp Milestones

Podpinanie nagrody do milestone:

```graphql
mutation {
  createStampCardTemplate(
    data: {
      merchantId: "merchant-id"
      title: "Karta Premium"
      stampsRequired: 10
      milestones: [
        {
          stampsRequired: 5
          rewardId: "reward-id" # Nowe pole!
          title: "Nagroda pośrednia"
        }
      ]
    }
  ) {
    id
    milestones {
      reward {
        title
        valueType
      }
    }
  }
}
```

### 3. Coupons

Podpinanie nagrody do kuponu:

```graphql
mutation {
  createCoupon(
    data: {
      code: "COFFEE20"
      title: "Zniżka na kawę"
      couponType: DISCOUNT
      availability: FREE
      rewardId: "reward-id" # Nowe pole!
      validFrom: "2024-01-01T00:00:00Z"
      validUntil: "2024-12-31T23:59:59Z"
    }
  ) {
    id
    title
    reward {
      title
      valueType
      discountPercent
    }
  }
}
```

**Legacy support**: Stare pola (discountType, discountValue) nadal działają dla kompatybilności wstecznej.

## Workflow

### Dla Merchanta (OWNER/COOPERATOR)

1. **Stwórz nagrodę**:

```graphql
mutation {
  createReward(
    data: { title: "Darmowa kawa", sourceType: STAMP_CARD, valueType: FREE_SERVICE, productName: "Kawa duża" }
  ) {
    id
  }
}
```

2. **Podepnij do szablonu pieczątek**:

```graphql
mutation {
  createStampCardTemplate(
    data: { merchantId: "auto-detected", title: "Karta Kawy", stampsRequired: 10, rewardId: "reward-id-from-step-1" }
  ) {
    id
  }
}
```

3. **Lub podepnij do kuponu**:

```graphql
mutation {
  createCoupon(
    data: {
      code: "FREECOFFEE"
      title: "Darmowa kawa"
      couponType: ITEM_SPECIFIC
      availability: POINTS
      pointsCost: 100
      rewardId: "reward-id-from-step-1"
      validFrom: "2024-01-01T00:00:00Z"
      validUntil: "2024-12-31T23:59:59Z"
    }
  ) {
    id
  }
}
```

### Dla Klienta

Klient widzi nagrody automatycznie w:

- `myStampCards` - nagrody w kartach pieczątek
- `myCoupons` - nagrody w kuponach
- `myActivities` - wszystkie aktywności z nagrodami

## Migracja danych

Po uruchomieniu migracji:

1. **Istniejące dane pozostają bez zmian** - legacy pola nadal działają
2. **Nowe nagrody** - można tworzyć przez `createReward`
3. **Stopniowa migracja** - można stopniowo przenosić nagrody z legacy pól do nowego systemu

## Korzyści

1. **Reużywalność** - jedna nagroda w wielu miejscach
2. **Centralne zarządzanie** - łatwa edycja nagród
3. **Spójność** - te same nagrody wszędzie
4. **Elastyczność** - różne typy nagród dla różnych scenariuszy
5. **Backward compatibility** - stary kod nadal działa
