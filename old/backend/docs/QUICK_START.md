# Quick Start - System Filtrowania i Sortowania

## Podstawowe Użycie

### 1. Proste wyszukiwanie z lokalizacją GPS

```graphql
query {
  unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 } }) {
    stores {
      store {
        id
        name
        address
      }
      distanceKm
    }
    coupons {
      coupon {
        id
        title
        pointsCost
      }
      distanceKm
    }
    metadata {
      totalResults
      filteredResults
    }
  }
}
```

### 2. Sortowanie alfabetyczne

```graphql
query {
  unifiedSearch(filters: {
    location: { latitude: 50.0647, longitude: 19.945 }
    sort: { sortBy: "ALPHABETICAL" }
  }) {
    stores { ... }
  }
}
```

### 3. Filtrowanie po kategorii

```graphql
query {
  unifiedSearch(filters: {
    location: { latitude: 50.0647, longitude: 19.945 }
    category: { categoryIds: ["cat-123", "cat-456"] }
  }) {
    stores { ... }
  }
}
```

### 4. Tylko darmowe kupony

```graphql
query {
  unifiedSearch(filters: {
    location: { latitude: 50.0647, longitude: 19.945 }
    points: { onlyFree: true }
  }) {
    coupons { ... }
  }
}
```

### 5. HOT kupony (domyślne sortowanie po odległości)

```graphql
query {
  unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, coupon: { displayTypes: ["HOT"] } }) {
    coupons {
      coupon {
        id
        title
        displayType
        pointsCost
      }
      distanceKm
    }
  }
}
```

### 6. Pobierz dostępne opcje filtrowania

```graphql
query {
  getCouponFilterOptions {
    availableCategories {
      id
      name
      count
    }
    availableCities {
      name
      count
    }
    pointsRange {
      min
      max
      freeCount
    }
    availableSortOptions
  }
}
```

## Dostępne Opcje Sortowania

- `DISTANCE` - Po odległości (domyślne)
- `ALPHABETICAL` - Alfabetycznie A-Z
- `ALPHABETICAL_DESC` - Alfabetycznie Z-A
- `PRIORITY` - Po priorytecie
- `NEWEST` - Najnowsze
- `OLDEST` - Najstarsze
- `POINTS_ASC` - Po punktach rosnąco
- `POINTS_DESC` - Po punktach malejąco
- `POPULARITY` - Po popularności
- `EXPIRING_SOON` - Wygasające najszybciej

## Przykład Kompletnego Zapytania

```graphql
query CompleteSearch {
  unifiedSearch(
    filters: {
      location: { latitude: 50.0647, longitude: 19.945, radiusKm: 15 }
      category: { categoryIds: ["cat-food", "cat-beauty"] }
      points: { maxPoints: 500, onlyFree: false }
      search: { city: "Kraków", searchText: "pizza" }
      sort: { sortBy: "DISTANCE", reverse: false }
      pagination: { page: 1, pageSize: 20 }
    }
  ) {
    stores {
      store {
        id
        name
        address
        city
      }
      merchant {
        name
        logoUrl
        category {
          name
        }
      }
      distanceKm
    }
    coupons {
      coupon {
        id
        title
        pointsCost
        discountType
        validUntil
      }
      merchant {
        name
      }
      distanceKm
    }
    stampCardStores {
      store {
        name
      }
      stampCardProgress {
        hasCard
        stampsCollected
        stampsRequired
      }
      distanceKm
    }
    metadata {
      availableCategories {
        id
        name
        count
      }
      availableCities {
        name
        count
      }
      pointsRange {
        min
        max
        freeCount
      }
      appliedFilters {
        sortBy
        categoryIds
        radiusKm
      }
      totalResults
      filteredResults
      hasUserLocation
    }
  }
}
```

## Więcej Informacji

- **Przykłady cURL**: `docs/CURL_EXAMPLES.md` ⭐ NOWE!
- Pełna dokumentacja: `docs/FILTERING_SORTING_GUIDE.md`
- Przykłady integracji: `docs/FRONTEND_INTEGRATION_EXAMPLES.md`
- Przewodnik migracji: `docs/API_MIGRATION_GUIDE.md`
