# Przykłady Integracji dla Frontendu - System Filtrowania i Sortowania

## React + Apollo Client - Kompletny Przykład

### 1. GraphQL Queries

```typescript
// queries/search.ts
import { gql } from '@apollo/client'

export const UNIFIED_SEARCH = gql`
  query UnifiedSearch($filters: UnifiedSearchInput!) {
    unifiedSearch(filters: $filters) {
      stores {
        store {
          id
          name
          address
          city
          latitude
          longitude
        }
        merchant {
          id
          name
          logoUrl
          category {
            id
            name
            slug
          }
        }
        distanceKm
      }
      coupons {
        coupon {
          id
          title
          description
          pointsCost
          discountType
          discountValue
          validUntil
          displayType
        }
        merchant {
          id
          name
          logoUrl
        }
        store {
          city
          address
        }
        distanceKm
      }
      stampCardStores {
        store {
          id
          name
          city
        }
        merchant {
          id
          name
          logoUrl
        }
        distanceKm
        stampIconUrl
        stampCardProgress {
          hasCard
          stampsCollected
          stampsRequired
          cardId
        }
      }
      metadata {
        availableCategories {
          id
          name
          slug
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
        availableDisplayTypes
        availableDiscountTypes
        appliedFilters {
          sortBy
          categoryIds
          radiusKm
          minPoints
          maxPoints
          city
          searchText
          displayTypes
          onlyFree
          onlyAffordable
        }
        totalResults
        filteredResults
        hasUserLocation
      }
      searchLatitude
      searchLongitude
    }
  }
`

export const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions {
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
`
```

### 2. Custom Hook dla Wyszukiwania

```typescript
// hooks/useUnifiedSearch.ts
import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { UNIFIED_SEARCH } from '../queries/search'

interface SearchFilters {
  location?: {
    latitude?: number
    longitude?: number
    radiusKm?: number
  }
  category?: {
    categoryIds?: string[]
  }
  points?: {
    minPoints?: number
    maxPoints?: number
    onlyFree?: boolean
  }
  search?: {
    searchText?: string
    city?: string
  }
  sort?: {
    sortBy?: string
    reverse?: boolean
  }
  pagination?: {
    page?: number
    pageSize?: number
  }
}

export const useUnifiedSearch = (initialFilters: SearchFilters = {}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)

  const { data, loading, error, refetch } = useQuery(UNIFIED_SEARCH, {
    variables: { filters },
    skip: !filters.location?.latitude || !filters.location?.longitude,
  })

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Merge nested objects
      location: { ...prev.location, ...newFilters.location },
      category: { ...prev.category, ...newFilters.category },
      points: { ...prev.points, ...newFilters.points },
      search: { ...prev.search, ...newFilters.search },
      sort: { ...prev.sort, ...newFilters.sort },
      pagination: { ...prev.pagination, ...newFilters.pagination },
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  return {
    data: data?.unifiedSearch,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch,
  }
}
```

### 3. Komponent Główny - Search Page

```typescript
// pages/SearchPage.tsx
import React, { useEffect } from 'react'
import { useUnifiedSearch } from '../hooks/useUnifiedSearch'
import { useGeolocation } from '../hooks/useGeolocation'
import { SearchFilters } from '../components/SearchFilters'
import { SearchResults } from '../components/SearchResults'
import { SortDropdown } from '../components/SortDropdown'

export const SearchPage: React.FC = () => {
  const { location, loading: locationLoading } = useGeolocation()
  const { data, loading, filters, updateFilters } = useUnifiedSearch()

  // Ustaw lokalizację gdy jest dostępna
  useEffect(() => {
    if (location) {
      updateFilters({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm: 10,
        },
      })
    }
  }, [location, updateFilters])

  if (locationLoading || loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="search-page">
      <SearchHeader>
        <SearchInput
          value={filters.search?.searchText || ''}
          onChange={(searchText) => updateFilters({ search: { searchText } })}
          placeholder="Szukaj sklepów, kuponów..."
        />
        <SortDropdown
          options={data?.metadata.availableSortOptions || []}
          selected={filters.sort?.sortBy || 'DISTANCE'}
          onChange={(sortBy) => updateFilters({ sort: { sortBy } })}
        />
      </SearchHeader>

      <div className="search-content">
        <SearchFilters metadata={data?.metadata} filters={filters} onFilterChange={updateFilters} />

        <SearchResults
          stores={data?.stores}
          coupons={data?.coupons}
          stampCardStores={data?.stampCardStores}
          metadata={data?.metadata}
        />
      </div>
    </div>
  )
}
```

### 4. Komponent Filtrów

```typescript
// components/SearchFilters.tsx
import React from 'react'
import { FilterMetadata } from '../types'

interface Props {
  metadata?: FilterMetadata
  filters: any
  onFilterChange: (filters: any) => void
}

export const SearchFilters: React.FC<Props> = ({ metadata, filters, onFilterChange }) => {
  if (!metadata) return null

  return (
    <div className="search-filters">
      {/* Kategorie */}
      <FilterSection title="Kategorie">
        {metadata.availableCategories.map((cat) => (
          <Checkbox
            key={cat.id}
            label={`${cat.name} (${cat.count})`}
            checked={filters.category?.categoryIds?.includes(cat.id)}
            onChange={(checked) => {
              const categoryIds = checked
                ? [...(filters.category?.categoryIds || []), cat.id]
                : filters.category?.categoryIds?.filter((id) => id !== cat.id)
              onFilterChange({ category: { categoryIds } })
            }}
          />
        ))}
      </FilterSection>

      {/* Miasta */}
      <FilterSection title="Miasta">
        {metadata.availableCities.slice(0, 10).map((city) => (
          <RadioButton
            key={city.name}
            label={`${city.name} (${city.count})`}
            checked={filters.search?.city === city.name}
            onChange={() => onFilterChange({ search: { city: city.name } })}
          />
        ))}
      </FilterSection>

      {/* Zakres punktów */}
      {metadata.pointsRange && (
        <FilterSection title="Punkty">
          <RangeSlider
            min={metadata.pointsRange.min}
            max={metadata.pointsRange.max}
            value={[
              filters.points?.minPoints || metadata.pointsRange.min,
              filters.points?.maxPoints || metadata.pointsRange.max,
            ]}
            onChange={([minPoints, maxPoints]) => onFilterChange({ points: { minPoints, maxPoints } })}
          />
          <Checkbox
            label={`Tylko darmowe (${metadata.pointsRange.freeCount})`}
            checked={filters.points?.onlyFree}
            onChange={(onlyFree) => onFilterChange({ points: { onlyFree } })}
          />
        </FilterSection>
      )}

      {/* Odległość */}
      <FilterSection title="Odległość">
        <RangeSlider
          min={0}
          max={50}
          value={filters.location?.radiusKm || 10}
          onChange={(radiusKm) => onFilterChange({ location: { radiusKm } })}
          unit="km"
        />
      </FilterSection>

      {/* Aktywne filtry */}
      <ActiveFilters
        filters={filters}
        metadata={metadata}
        onRemove={(key, value) => {
          // Logika usuwania filtrów
        }}
      />
    </div>
  )
}
```

### 5. Komponent Wyników

```typescript
// components/SearchResults.tsx
import React, { useState } from 'react'

interface Props {
  stores?: any[]
  coupons?: any[]
  stampCardStores?: any[]
  metadata?: any
}

export const SearchResults: React.FC<Props> = ({ stores, coupons, stampCardStores, metadata }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'stores' | 'coupons' | 'stamps'>('all')

  return (
    <div className="search-results">
      {/* Tabs */}
      <Tabs>
        <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
          Wszystko ({metadata?.filteredResults || 0})
        </Tab>
        <Tab active={activeTab === 'stores'} onClick={() => setActiveTab('stores')}>
          Sklepy ({stores?.length || 0})
        </Tab>
        <Tab active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')}>
          Kupony ({coupons?.length || 0})
        </Tab>
        <Tab active={activeTab === 'stamps'} onClick={() => setActiveTab('stamps')}>
          Stemple ({stampCardStores?.length || 0})
        </Tab>
      </Tabs>

      {/* Results */}
      <div className="results-list">
        {(activeTab === 'all' || activeTab === 'stores') &&
          stores?.map((item) => <StoreCard key={item.store.id} {...item} />)}

        {(activeTab === 'all' || activeTab === 'coupons') &&
          coupons?.map((item) => <CouponCard key={item.coupon.id} {...item} />)}

        {(activeTab === 'all' || activeTab === 'stamps') &&
          stampCardStores?.map((item) => <StampCard key={item.store.id} {...item} />)}
      </div>

      {/* Metadata */}
      {metadata && (
        <ResultsFooter>
          Pokazano {metadata.filteredResults} z {metadata.totalResults} wyników
        </ResultsFooter>
      )}
    </div>
  )
}
```

## Vue 3 + Composition API Przykład

```typescript
// composables/useUnifiedSearch.ts
import { ref, computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { UNIFIED_SEARCH } from '../graphql/queries'

export function useUnifiedSearch(initialFilters = {}) {
  const filters = ref(initialFilters)

  const { result, loading, error, refetch } = useQuery(
    UNIFIED_SEARCH,
    () => ({ filters: filters.value }),
    () => ({
      enabled: !!filters.value.location?.latitude,
    })
  )

  const data = computed(() => result.value?.unifiedSearch)

  const updateFilters = (newFilters) => {
    filters.value = {
      ...filters.value,
      ...newFilters,
    }
  }

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refetch,
  }
}
```

## React Native Przykład

```typescript
// screens/SearchScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { useQuery } from '@apollo/client'
import * as Location from 'expo-location'
import { UNIFIED_SEARCH } from '../graphql/queries'

export const SearchScreen = () => {
  const [location, setLocation] = useState(null)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({})
        setLocation(loc.coords)
        setFilters({
          location: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            radiusKm: 10,
          },
        })
      }
    })()
  }, [])

  const { data, loading } = useQuery(UNIFIED_SEARCH, {
    variables: { filters },
    skip: !location,
  })

  if (loading) return <ActivityIndicator />

  return (
    <View>
      <FlatList
        data={data?.unifiedSearch?.coupons || []}
        renderItem={({ item }) => <CouponCard item={item} />}
        keyExtractor={(item) => item.coupon.id}
      />
    </View>
  )
}
```

## Zapisywanie Filtrów w Local Storage

```typescript
// utils/filterStorage.ts
const FILTERS_KEY = 'search_filters'

export const saveFilters = (filters: any) => {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
}

export const loadFilters = (): any => {
  const saved = localStorage.getItem(FILTERS_KEY)
  return saved ? JSON.parse(saved) : {}
}

export const clearFilters = () => {
  localStorage.removeItem(FILTERS_KEY)
}

// Użycie w komponencie
const savedFilters = loadFilters()
const { filters, updateFilters } = useUnifiedSearch(savedFilters)

useEffect(() => {
  saveFilters(filters)
}, [filters])
```

## Synchronizacja z URL (Next.js)

```typescript
// hooks/useSearchParams.ts
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const useSearchParams = (filters, updateFilters) => {
  const router = useRouter()

  // Zapisz filtry do URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.sort?.sortBy) {
      params.set('sort', filters.sort.sortBy)
    }
    if (filters.category?.categoryIds?.length) {
      params.set('categories', filters.category.categoryIds.join(','))
    }
    if (filters.search?.city) {
      params.set('city', filters.search.city)
    }

    router.push(`/search?${params.toString()}`, undefined, { shallow: true })
  }, [filters])

  // Wczytaj filtry z URL przy montowaniu
  useEffect(() => {
    const { sort, categories, city } = router.query

    if (sort || categories || city) {
      updateFilters({
        sort: sort ? { sortBy: sort } : undefined,
        category: categories ? { categoryIds: categories.split(',') } : undefined,
        search: city ? { city } : undefined,
      })
    }
  }, [])
}
```

To kompletny system filtrowania i sortowania gotowy do użycia!
