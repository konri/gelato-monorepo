# Przewodnik Migracji API - System Filtrowania i Sortowania

## Przegląd Zmian

Nowy system wprowadza zunifikowany endpoint `unifiedSearch` z zaawansowanym filtrowaniem i sortowaniem, zastępując dotychczasowe osobne endpointy.

## Mapowanie Starych Endpointów na Nowe

### 1. nearbyStores → unifiedSearch

**Przed:**

```graphql
query NearbyStores($location: LocationSearchInput!) {
  nearbyStores(location: $location) {
    store {
      id
      name
    }
    merchant {
      id
      name
    }
    distanceKm
  }
}
```

**Po:**

```graphql
query UnifiedSearch($filters: UnifiedSearchInput!) {
  unifiedSearch(filters: $filters) {
    stores {
      store {
        id
        name
      }
      merchant {
        id
        name
      }
      distanceKm
    }
    metadata {
      availableCategories {
        id
        name
        count
      }
      totalResults
    }
  }
}
```

**Zmienne:**

```typescript
// Przed
{ location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 } }

// Po
{ filters: { location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 } } }
```

### 2. nearbyCoupons → unifiedSearch

**Przed:**

```graphql
query NearbyCoupons($location: LocationSearchInput!) {
  nearbyCoupons(location: $location) {
    coupon {
      id
      title
      pointsCost
    }
    distanceKm
  }
}
```

**Po:**

```graphql
query UnifiedSearch($filters: UnifiedSearchInput!) {
  unifiedSearch(filters: $filters) {
    coupons {
      coupon {
        id
        title
        pointsCost
      }
      distanceKm
    }
  }
}
```

### 3. nearbyStampCardStores → unifiedSearch

**Przed:**

```graphql
query NearbyStampCardStores($location: LocationSearchInput) {
  nearbyStampCardStores(location: $location) {
    store {
      id
      name
    }
    stampCardProgress {
      hasCard
      stampsCollected
    }
  }
}
```

**Po:**

```graphql
query UnifiedSearch($filters: UnifiedSearchInput!) {
  unifiedSearch(filters: $filters) {
    stampCardStores {
      store {
        id
        name
      }
      stampCardProgress {
        hasCard
        stampsCollected
      }
    }
  }
}
```

## Nowe Możliwości

### 1. Sortowanie

```graphql
# Sortowanie alfabetyczne
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    sort: { sortBy: "ALPHABETICAL" }
  }
}

# Sortowanie po punktach
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    sort: { sortBy: "POINTS_ASC" }
  }
}

# Sortowanie po popularności
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    sort: { sortBy: "POPULARITY" }
  }
}
```

### 2. Filtrowanie po Kategoriach

```graphql
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    category: {
      categoryIds: ["cat-123", "cat-456"]
    }
  }
}
```

### 3. Filtrowanie po Punktach

```graphql
# Tylko darmowe
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    points: { onlyFree: true }
  }
}

# Zakres punktów
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    points: { minPoints: 0, maxPoints: 500 }
  }
}

# Tylko dostępne dla użytkownika
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    coupon: { onlyAffordable: true }
  }
}
```

### 4. Filtrowanie po Mieście

```graphql
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    search: { city: "Kraków" }
  }
}
```

### 5. Wyszukiwanie Tekstowe

```graphql
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    search: { searchText: "pizza" }
  }
}
```

### 6. Paginacja

```graphql
{
  filters: {
    location: { latitude: 50.0647, longitude: 19.945 },
    pagination: { page: 1, pageSize: 20 }
  }
}
```

## Strategia Migracji Krok po Kroku

### Faza 1: Dodanie Nowych Endpointów (Backward Compatible)

1. Nowe endpointy działają równolegle ze starymi
2. Frontend może stopniowo migrować
3. Stare endpointy oznaczone jako `@deprecated`

```graphql
type Query {
  # Nowe
  unifiedSearch(filters: UnifiedSearchInput!): UnifiedSearchResult!

  # Stare (deprecated)
  nearbyStores(location: LocationSearchInput!): [StoreWithDistance!]! @deprecated(reason: "Use unifiedSearch instead")
  nearbyCoupons(location: LocationSearchInput!): [CouponWithDistance!]! @deprecated(reason: "Use unifiedSearch instead")
}
```

### Faza 2: Migracja Frontendu

```typescript
// Krok 1: Dodaj nowy hook obok starego
import { useNearbyStores } from './hooks/useNearbyStores'; // stary
import { useUnifiedSearch } from './hooks/useUnifiedSearch'; // nowy

// Krok 2: Użyj feature flag do przełączania
const USE_NEW_API = process.env.REACT_APP_USE_NEW_SEARCH_API === 'true';

const SearchPage = () => {
  if (USE_NEW_API) {
    const { data } = useUnifiedSearch({ ... });
    return <NewSearchResults data={data.stores} />;
  } else {
    const { data } = useNearbyStores({ ... });
    return <OldSearchResults data={data} />;
  }
};

// Krok 3: Testuj nowy API
// Krok 4: Usuń stary kod
```

### Faza 3: Usunięcie Starych Endpointów

Po pełnej migracji frontendu:

1. Usuń stare endpointy z GraphQL schema
2. Usuń stare resolwery
3. Zaktualizuj dokumentację

## Przykłady Migracji Komponentów

### Przykład 1: Lista Sklepów

**Przed:**

```typescript
const StoresList = () => {
  const { data, loading } = useQuery(NEARBY_STORES, {
    variables: {
      location: {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm: 10,
      },
    },
  })

  return (
    <div>
      {data?.nearbyStores.map((item) => (
        <StoreCard key={item.store.id} {...item} />
      ))}
    </div>
  )
}
```

**Po:**

```typescript
const StoresList = () => {
  const { data, loading } = useQuery(UNIFIED_SEARCH, {
    variables: {
      filters: {
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusKm: 10,
        },
        sort: { sortBy: 'DISTANCE' }, // Nowa opcja!
      },
    },
  })

  return (
    <div>
      {/* Dodatkowe informacje z metadata */}
      <FilterInfo>Znaleziono {data?.unifiedSearch.metadata.filteredResults} wyników</FilterInfo>

      {data?.unifiedSearch.stores.map((item) => (
        <StoreCard key={item.store.id} {...item} />
      ))}
    </div>
  )
}
```

### Przykład 2: Lista Kuponów z Filtrowaniem

**Przed:**

```typescript
const CouponsList = () => {
  const { data } = useQuery(NEARBY_COUPONS, {
    variables: { location: userLocation },
  })

  // Filtrowanie po stronie klienta
  const filteredCoupons = data?.nearbyCoupons.filter((item) => item.coupon.pointsCost <= userPoints)

  return (
    <div>
      {filteredCoupons?.map((item) => (
        <CouponCard key={item.coupon.id} {...item} />
      ))}
    </div>
  )
}
```

**Po:**

```typescript
const CouponsList = () => {
  const { data } = useQuery(UNIFIED_SEARCH, {
    variables: {
      filters: {
        location: userLocation,
        coupon: {
          onlyAffordable: true, // Filtrowanie po stronie serwera!
        },
        sort: { sortBy: 'POINTS_ASC' },
      },
    },
  })

  return (
    <div>
      {/* Metadata pokazuje dostępne opcje */}
      <PointsRange>
        Punkty: {data?.unifiedSearch.metadata.pointsRange.min} -{data?.unifiedSearch.metadata.pointsRange.max}
      </PointsRange>

      {data?.unifiedSearch.coupons.map((item) => (
        <CouponCard key={item.coupon.id} {...item} />
      ))}
    </div>
  )
}
```

## Checklist Migracji

- [ ] Zaktualizuj GraphQL queries
- [ ] Zmień strukturę zmiennych (location → filters.location)
- [ ] Zaktualizuj ścieżki dostępu do danych (data.nearbyStores → data.unifiedSearch.stores)
- [ ] Dodaj obsługę metadata (opcjonalne, ale zalecane)
- [ ] Dodaj sortowanie (opcjonalne)
- [ ] Dodaj filtrowanie (opcjonalne)
- [ ] Przetestuj z różnymi kombinacjami filtrów
- [ ] Zaktualizuj testy jednostkowe
- [ ] Zaktualizuj dokumentację

## Wsparcie i Kompatybilność Wsteczna

Stare endpointy będą dostępne przez okres przejściowy (np. 3 miesiące) z oznaczeniem `@deprecated`. Po tym czasie zostaną usunięte.

**Timeline:**

- Miesiąc 1: Wprowadzenie nowych endpointów
- Miesiąc 2-3: Migracja frontendu
- Miesiąc 4: Usunięcie starych endpointów

## Pytania i Odpowiedzi

**Q: Czy muszę od razu używać wszystkich filtrów?**
A: Nie, możesz zacząć od podstawowego użycia z samą lokalizacją, a filtry dodawać stopniowo.

**Q: Czy nowy endpoint jest wolniejszy?**
A: Nie, wydajność jest porównywalna lub lepsza dzięki optymalizacjom.

**Q: Co jeśli nie mam lokalizacji użytkownika?**
A: System automatycznie użyje preferowanego miasta użytkownika lub domyślnej lokalizacji.

**Q: Czy mogę używać starych i nowych endpointów jednocześnie?**
A: Tak, w okresie przejściowym oba działają równolegle.
