# System Filtrowania i Sortowania - Dokumentacja

## Przegląd

System zapewnia zaawansowane możliwości filtrowania i sortowania dla wszystkich endpointów związanych z lokalizacją użytkownika, kuponami, sklepami i kartami stempli.

> **Uwaga:** Enum sortowania nazywa się `SearchSortOrder` w kodzie TypeScript, ale w GraphQL używasz wartości jako stringów (np. `"DISTANCE"`, `"ALPHABETICAL"`).

> **Przykłady cURL:** Zobacz `docs/CURL_EXAMPLES.md` dla gotowych przykładów testowania API.

## Główne Funkcjonalności

### 1. Sortowanie (SearchSortOrder enum)

Dostępne opcje sortowania:

- **DISTANCE** (domyślne) - Sortowanie po odległości od użytkownika
- **ALPHABETICAL** - Alfabetycznie A-Z
- **ALPHABETICAL_DESC** - Alfabetycznie Z-A
- **PRIORITY** - Po priorytecie (dla kuponów/promocji)
- **NEWEST** - Najnowsze
- **OLDEST** - Najstarsze
- **POINTS_ASC** - Po kosztach punktów rosnąco
- **POINTS_DESC** - Po kosztach punktów malejąco
- **POPULARITY** - Po popularności (liczba użyć)
- **EXPIRING_SOON** - Wygasające najszybciej

### 2. Filtry

#### LocationFilter

```graphql
{
  latitude: Float
  longitude: Float
  radiusKm: Float (domyślnie: 10)
  minDistanceKm: Float
  maxDistanceKm: Float
}
```

#### CategoryFilter

```graphql
{
  categoryIds: [String]      # Lista ID kategorii (dokładne dopasowanie)
  categorySlugs: [String]    # Lista slugów kategorii (dokładne dopasowanie)
  categoryNames: [String]    # Lista nazw kategorii (częściowe dopasowanie, case-insensitive)
}
```

#### PointsFilter

```graphql
{
  minPoints: Int
  maxPoints: Int
  onlyFree: Boolean # Tylko darmowe (0 punktów)
}
```

#### DateFilter

```graphql
{
  validFrom: Date
  validUntil: Date
  expiringInDays: Int # Wygasające w ciągu X dni
}
```

#### StampCardFilter

```graphql
{
  onlyActive: Boolean
  minStampsRequired: Int
  maxStampsRequired: Int
  hasMilestones: Boolean
  closeToReward: Boolean # Użytkownik ma ≥70% stempli
}
```

#### CouponFilter

```graphql
{
  displayTypes: [String]  # HOT, PROMOTED, STANDARD
  couponTypes: [String]
  discountTypes: [String]  # PERCENT, AMOUNT, FREE
  onlyUnused: Boolean
  onlyAffordable: Boolean  # Użytkownik ma wystarczająco punktów
}
```

#### SearchFilter

```graphql
{
  searchText: String
  city: String
  cities: [String]
}
```

#### PaginationInput

```graphql
{
  page: Int (domyślnie: 1)
  pageSize: Int (domyślnie: 20)
  skip: Int
  take: Int
}
```

#### SortInput

```graphql
{
  sortBy: SearchSortOrder (domyślnie: DISTANCE)
  reverse: Boolean (domyślnie: false)
}
```

## Endpointy GraphQL

### 1. Zunifikowane Wyszukiwanie

```graphql
query UnifiedSearch($filters: UnifiedSearchInput!) {
  unifiedSearch(filters: $filters) {
    stores {
      store {
        id
        name
        address
        city
      }
      merchant {
        id
        name
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
      }
      merchant {
        id
        name
      }
      store {
        city
      }
      distanceKm
    }
    stampCardStores {
      store {
        id
        name
      }
      merchant {
        id
        name
      }
      distanceKm
      stampCardProgress {
        hasCard
        stampsCollected
        stampsRequired
      }
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
      distanceRange {
        min
        max
        average
      }
      availableSortOptions
      appliedFilters {
        sortBy
        categoryIds
        radiusKm
        minPoints
        maxPoints
      }
      totalResults
      filteredResults
      hasUserLocation
    }
    searchLatitude
    searchLongitude
  }
}
```

### 2. Pobierz Opcje Filtrowania

```graphql
# Dla kuponów
query GetCouponFilters {
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
    availableDisplayTypes
    availableDiscountTypes
  }
}

# Dla sklepów
query GetStoreFilters {
  getStoreFilterOptions {
    availableCategories {
      id
      name
      count
    }
    availableCities {
      name
      count
    }
    availableSortOptions
  }
}

# Dla kart stempli
query GetStampCardFilters {
  getStampCardFilterOptions {
    availableCategories {
      id
      name
      count
    }
    availableCities {
      name
      count
    }
    availableSortOptions
  }
}
```

## Przykłady Użycia dla Frontendu

### Przykład 1: Podstawowe wyszukiwanie z lokalizacją GPS

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      location: {
        latitude: 50.0647,
        longitude: 19.945,
        radiusKm: 10,
      },
      sort: {
        sortBy: 'DISTANCE',
      },
    },
  },
})
```

### Przykład 2: Filtrowanie kuponów po kategorii i punktach

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      location: {
        latitude: 50.0647,
        longitude: 19.945,
        radiusKm: 15,
      },
      category: {
        categoryIds: ['cat-123', 'cat-456'],
      },
      points: {
        maxPoints: 500,
        onlyAffordable: true, // Tylko te, na które użytkownik ma punkty
      },
      sort: {
        sortBy: 'POINTS_ASC',
      },
    },
  },
})
```

### Przykład 3: Wyszukiwanie kart stempli blisko nagrody

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      location: {
        latitude: 50.0647,
        longitude: 19.945,
        radiusKm: 20,
      },
      stampCard: {
        closeToReward: true, // Użytkownik ma ≥70% stempli
      },
      sort: {
        sortBy: 'DISTANCE',
      },
    },
  },
})
```

### Przykład 4: Sortowanie alfabetyczne z filtrem miasta

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      search: {
        city: 'Kraków',
        searchText: 'pizza',
      },
      sort: {
        sortBy: 'ALPHABETICAL',
      },
      pagination: {
        page: 1,
        pageSize: 20,
      },
    },
  },
})
```

### Przykład 5: Kupony wygasające wkrótce

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      location: {
        latitude: 50.0647,
        longitude: 19.945,
        radiusKm: 25,
      },
      date: {
        expiringInDays: 7, // Wygasające w ciągu 7 dni
      },
      sort: {
        sortBy: 'EXPIRING_SOON',
      },
    },
  },
})
```

## Workflow dla Frontendu

### Krok 1: Pobierz dostępne opcje filtrowania

```typescript
// Na początku pobierz dostępne filtry
const { data: filterOptions } = await client.query({
  query: GET_COUPON_FILTER_OPTIONS,
})

// Wyświetl użytkownikowi:
// - Dostępne kategorie z liczbą wyników
// - Dostępne miasta
// - Zakres punktów (min, max, liczba darmowych)
// - Dostępne opcje sortowania
```

### Krok 2: Użytkownik wybiera filtry

```typescript
// Użytkownik wybiera:
const userFilters = {
  categoryIds: ['cat-123'], // Z listy availableCategories
  city: 'Kraków', // Z listy availableCities
  maxPoints: 1000, // Na podstawie pointsRange
  sortBy: 'DISTANCE', // Z listy availableSortOptions
}
```

### Krok 3: Wykonaj wyszukiwanie z filtrami

```typescript
const { data } = await client.query({
  query: UNIFIED_SEARCH,
  variables: {
    filters: {
      location: userLocation,
      category: { categoryIds: userFilters.categoryIds },
      search: { city: userFilters.city },
      points: { maxPoints: userFilters.maxPoints },
      sort: { sortBy: userFilters.sortBy },
    },
  },
})
```

### Krok 4: Wyświetl wyniki z metadanymi

```typescript
// Wyświetl:
// - data.coupons / data.stores / data.stampCardStores
// - data.metadata.appliedFilters (aktywne filtry)
// - data.metadata.totalResults vs filteredResults
// - data.metadata.availableCategories (zaktualizowane liczby)
```

## Komponenty UI - Sugestie

### 1. Komponent Sortowania

```typescript
<SortDropdown
  options={metadata.availableSortOptions}
  selected={metadata.appliedFilters.sortBy}
  onChange={(sortBy) => updateFilters({ sort: { sortBy } })}
/>
```

### 2. Komponent Filtrów Kategorii

```typescript
<CategoryFilter
  categories={metadata.availableCategories}
  selected={metadata.appliedFilters.categoryIds}
  onChange={(categoryIds) => updateFilters({ category: { categoryIds } })}
/>
```

### 3. Komponent Zakresu Punktów

```typescript
<PointsRangeSlider
  min={metadata.pointsRange.min}
  max={metadata.pointsRange.max}
  value={[appliedFilters.minPoints, appliedFilters.maxPoints]}
  onChange={(range) =>
    updateFilters({
      points: {
        minPoints: range[0],
        maxPoints: range[1],
      },
    })
  }
/>
```

### 4. Komponent Zakresu Odległości

```typescript
<DistanceSlider
  min={0}
  max={50}
  value={appliedFilters.radiusKm}
  onChange={(radiusKm) => updateFilters({ location: { radiusKm } })}
/>
```

### 5. Badge Aktywnych Filtrów

```typescript
<ActiveFilters>
  {appliedFilters.categoryIds?.map((id) => (
    <FilterBadge key={id} label={getCategoryName(id)} onRemove={() => removeFilter('category', id)} />
  ))}
  {appliedFilters.city && <FilterBadge label={appliedFilters.city} onRemove={() => removeFilter('city')} />}
</ActiveFilters>
```

## Dobre Praktyki

### 1. Lazy Loading Filtrów

```typescript
// Najpierw załaduj wyniki z domyślnymi filtrami
const { data } = await unifiedSearch({
  location: userLocation,
})

// Następnie w tle załaduj opcje filtrowania
const { data: filters } = await getCouponFilterOptions()
```

### 2. Debouncing dla Wyszukiwania Tekstowego

```typescript
const debouncedSearch = useMemo(
  () =>
    debounce((searchText: string) => {
      updateFilters({ search: { searchText } })
    }, 500),
  []
)
```

### 3. Zapisywanie Filtrów w URL

```typescript
// Zapisz filtry w query params
const searchParams = new URLSearchParams({
  sort: filters.sort.sortBy,
  categories: filters.category.categoryIds.join(','),
  city: filters.search.city,
  radius: filters.location.radiusKm.toString(),
})

router.push(`/search?${searchParams.toString()}`)
```

### 4. Optymistyczne UI

```typescript
// Natychmiast zaktualizuj UI, zanim przyjdzie odpowiedź
setLocalFilters(newFilters)
setIsLoading(true)

try {
  const { data } = await unifiedSearch({ filters: newFilters })
  setResults(data)
} catch (error) {
  // Przywróć poprzednie filtry w przypadku błędu
  setLocalFilters(previousFilters)
}
```

## Migracja z Istniejących Endpointów

### Przed (stare endpointy):

```typescript
// Osobne zapytania
const stores = await nearbyStores({ latitude, longitude, radiusKm: 10 })
const coupons = await nearbyCoupons({ latitude, longitude, radiusKm: 10 })
const stamps = await nearbyStampCardStores({ latitude, longitude })
```

### Po (nowy endpoint):

```typescript
// Jedno zapytanie z wszystkimi danymi
const { data } = await unifiedSearch({
  filters: {
    location: { latitude, longitude, radiusKm: 10 },
  },
})

// Dostęp do wszystkiego:
const stores = data.stores
const coupons = data.coupons
const stamps = data.stampCardStores
const metadata = data.metadata
```

## Wydajność

- Wszystkie filtry są stosowane w pamięci po pobraniu danych z bazy
- Sortowanie używa wydajnych algorytmów natywnych JavaScript
- Paginacja zmniejsza ilość przesyłanych danych
- Metadane są generowane raz i cache'owane

## Rozszerzalność

System jest zaprojektowany tak, aby łatwo dodawać nowe:

- Opcje sortowania (dodaj do enum SearchSortOrder w `src/shared/enums/SortOrder.ts`)
- Typy filtrów (dodaj nowy InputType w `src/shared/inputTypes/FilterOptions.ts`)
- Metadane (rozszerz FilterMetadata w `src/shared/objectTypes/FilterMetadata.ts`)

## Uwaga o Nazewnictwie

Enum sortowania nazywa się `SearchSortOrder` (nie `SortOrder`), aby uniknąć konfliktu z istniejącym enumem `SortOrder` używanym w innych częściach aplikacji.
