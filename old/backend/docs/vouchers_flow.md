# User Activities Flow

## Overview

System aktywności użytkownika agreguje wszystkie akcje użytkownika w jednym endpoincie z możliwością filtrowania i sortowania.

## Endpoint

### myActivities

**Query**: `myActivities(filter?: UserActivityFilter, sort?: Sort[])`

**Zwraca**: Lista wszystkich aktywności użytkownika ze wszystkich systemów

## Typy aktywności

1. **STAMP_CARD** - Karty pieczątek
2. **COUPON** - Kupony
3. **POINT_VOUCHER** - Vouchery punktowe

## Statusy

- **ACTIVE** - Aktywne (nowe karty, ważne kupony/vouchery)
- **IN_PROGRESS** - W trakcie (karty z częściowymi pieczątkami)
- **COMPLETED** - Ukończone (karty z pełnymi pieczątkami)
- **EXPIRED** - Przeterminowane
- **USED** - Wykorzystane

## Filtrowanie

```graphql
filter: {
  types: [STAMP_CARD, COUPON, POINT_VOUCHER]
  statuses: [ACTIVE, IN_PROGRESS, COMPLETED, EXPIRED, USED]
  merchantId: "merchant-id"
  searchText: "tekst do wyszukania"
}
```

## Sortowanie

```graphql
sort: [
  { field: "createdAt", order: desc }
  { field: "title", order: asc }
]
```

## Przykłady użycia

### Wszystkie aktywności

```graphql
query {
  myActivities {
    id
    type
    status
    title
    merchant {
      name
    }
    createdAt
  }
}
```

### Tylko aktywne karty pieczątek

```graphql
query {
  myActivities(filter: { types: [STAMP_CARD], statuses: [ACTIVE, IN_PROGRESS] }) {
    id
    type
    status
    title
    stampsCollected
    stampsRequired
  }
}
```

### Wyszukiwanie z sortowaniem

```graphql
query {
  myActivities(filter: { searchText: "kawa" }, sort: [{ field: "createdAt", order: desc }]) {
    id
    type
    title
    merchant {
      name
    }
  }
}
```
