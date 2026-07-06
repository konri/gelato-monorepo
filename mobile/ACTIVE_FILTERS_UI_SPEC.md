# Active Filters & Sorting Display - UI Specification

## Przegląd

Wyświetlanie aktywnych filtrów i sortowania na głównym ekranie z możliwością szybkiego usuwania pojedynczych filtrów bez otwierania pełnego modala filtrów.

## Design Inspiracje

Wzorowane na:
- **Airbnb** - chips z filtrami nad listą wyników
- **Booking.com** - kompaktowe wyświetlanie aktywnych filtrów
- **Uber Eats** - sortowanie i filtry w jednej linii
- **Zalando** - chips z X do usuwania filtrów

## Lokalizacja

Umieszczone **nad listą wyników**, **pod search barem**, w formie:
1. Dropdown sortowania (zawsze widoczny)
2. Chips z aktywnymi filtrami (widoczne tylko gdy są aktywne)
3. Przycisk "Clear all" (widoczny gdy są aktywne filtry)

## Layout

```
┌─────────────────────────────────────────────────┐
│  🔍 Search bar                                  │
├─────────────────────────────────────────────────┤
│  📊 Sort: [Distance ▼]  🎯 Filters (3)         │
├─────────────────────────────────────────────────┤
│  Active Filters:                                │
│  [🔥 HOT ×] [🍕 Food ×] [💰 Free ×]  Clear all │
├─────────────────────────────────────────────────┤
│  Results (32 found)                             │
│  ┌───────────────────────────────────────────┐ │
│  │  Coupon 1                                 │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Komponenty

### 1. Sort Dropdown (Zawsze widoczny)

**Wygląd:**
```
┌──────────────────────────┐
│ 📍 Distance        ▼     │
└──────────────────────────┘
```

**Expanded:**
```
┌──────────────────────────┐
│ ✓ 📍 Distance            │
│   🔤 A-Z                 │
│   🔤 Z-A                 │
│   ⭐ Priority            │
│   🆕 Newest              │
│   💰 Points: Low-High    │
│   💰 Points: High-Low    │
│   ⏰ Expiring Soon       │
│   📊 Popularity          │
└──────────────────────────┘
```

**Props:**
```typescript
interface SortDropdownProps {
  currentSort: SearchSortOrder
  onSortChange: (sort: SearchSortOrder) => void
  availableSortOptions: SearchSortOrder[]
}
```

**Ikony dla sortowania:**
- `DISTANCE` → 📍 "Distance"
- `ALPHABETICAL` → 🔤 "A-Z"
- `ALPHABETICAL_DESC` → 🔤 "Z-A"
- `PRIORITY` → ⭐ "Priority"
- `NEWEST` → 🆕 "Newest"
- `OLDEST` → 📅 "Oldest"
- `POINTS_ASC` → 💰 "Points: Low-High"
- `POINTS_DESC` → 💰 "Points: High-Low"
- `EXPIRING_SOON` → ⏰ "Expiring Soon"
- `POPULARITY` → 📊 "Popularity"

### 2. Filters Button

**Wygląd (bez aktywnych filtrów):**
```
┌──────────────┐
│ 🎯 Filters   │
└──────────────┘
```

**Wygląd (z aktywnymi filtrami):**
```
┌──────────────┐
│ 🎯 Filters ③ │  ← Badge z liczbą aktywnych filtrów
└──────────────┘
```

**Akcja:** Otwiera pełny modal z filtrami

### 3. Active Filters Chips

**Wyświetlane tylko gdy są aktywne filtry**

**Wygląd:**
```
Active Filters:
[🔥 HOT ×] [🍕 Food ×] [🍰 Desserts ×] [💰 Free ×] [📍 5km ×]  Clear all
```

**Typy chipów:**

#### Display Type Chips
```typescript
displayTypes: ["HOT", "PROMOTED", "STANDARD"]
// Wyświetlane jako:
[🔥 HOT ×] [⭐ Promoted ×] [📋 Standard ×]
```

#### Category Chips
```typescript
categories: [{id: "cat-1", name: "Food", slug: "food"}]
// Wyświetlane jako:
[🍕 Food ×] [🍰 Desserts ×]
```

#### Points Chips
```typescript
// onlyFree: true
[💰 Free ×]

// minPoints: 100, maxPoints: 500
[💰 100-500 pts ×]

// minPoints: 100
[💰 Min 100 pts ×]

// maxPoints: 500
[💰 Max 500 pts ×]
```

#### Distance Chips
```typescript
// radiusKm: 5
[📍 Within 5km ×]

// minDistanceKm: 2, maxDistanceKm: 10
[📍 2-10km ×]
```

#### City Chip
```typescript
city: "Kraków"
// Wyświetlane jako:
[🏙️ Kraków ×]
```

#### Search Text Chip
```typescript
searchText: "pizza"
// Wyświetlane jako:
[🔍 "pizza" ×]
```

#### Date Chips
```typescript
// expiringInDays: 7
[⏰ Expiring in 7 days ×]
```

#### Coupon Type Chips
```typescript
discountTypes: ["PERCENT", "AMOUNT"]
// Wyświetlane jako:
[% Percentage ×] [💵 Amount ×]
```

#### Affordability Chip
```typescript
onlyAffordable: true
// Wyświetlane jako:
[✅ Can afford ×]
```

### 4. Clear All Button

**Wygląd:**
```
Clear all
```

**Akcja:** Usuwa wszystkie aktywne filtry (oprócz sortowania)

## Implementacja React Native

### ActiveFiltersBar.tsx

```typescript
import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SearchSortOrder } from '../types/graphql'

interface ActiveFilter {
  id: string
  type: 'displayType' | 'category' | 'points' | 'distance' | 'city' | 'search' | 'date' | 'discountType' | 'affordability'
  label: string
  icon: string
  value: any
}

interface ActiveFiltersBarProps {
  currentSort: SearchSortOrder
  availableSortOptions: SearchSortOrder[]
  activeFilters: ActiveFilter[]
  activeFiltersCount: number
  onSortChange: (sort: SearchSortOrder) => void
  onRemoveFilter: (filterId: string) => void
  onClearAll: () => void
  onOpenFilters: () => void
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  currentSort,
  availableSortOptions,
  activeFilters,
  activeFiltersCount,
  onSortChange,
  onRemoveFilter,
  onClearAll,
  onOpenFilters,
}) => {
  const sortLabel = getSortLabel(currentSort)
  const sortIcon = getSortIcon(currentSort)

  return (
    <View style={styles.container}>
      {/* Top Row: Sort + Filters Button */}
      <View style={styles.topRow}>
        <SortDropdown
          currentSort={currentSort}
          availableSortOptions={availableSortOptions}
          onSortChange={onSortChange}
          icon={sortIcon}
          label={sortLabel}
        />
        
        <TouchableOpacity 
          style={styles.filtersButton}
          onPress={onOpenFilters}
        >
          <Text style={styles.filtersButtonText}>🎯 Filters</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsLabel}>Active Filters:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
          >
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                icon={filter.icon}
                label={filter.label}
                onRemove={() => onRemoveFilter(filter.id)}
              />
            ))}
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={onClearAll}
            >
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// Filter Chip Component
const FilterChip: React.FC<{
  icon: string
  label: string
  onRemove: () => void
}> = ({ icon, label, onRemove }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>
      {icon} {label}
    </Text>
    <TouchableOpacity 
      style={styles.chipRemove}
      onPress={onRemove}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.chipRemoveText}>×</Text>
    </TouchableOpacity>
  </View>
)

// Sort Dropdown Component
const SortDropdown: React.FC<{
  currentSort: SearchSortOrder
  availableSortOptions: SearchSortOrder[]
  onSortChange: (sort: SearchSortOrder) => void
  icon: string
  label: string
}> = ({ currentSort, availableSortOptions, onSortChange, icon, label }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <View style={styles.sortContainer}>
      <TouchableOpacity 
        style={styles.sortButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.sortButtonText}>
          {icon} {label}
        </Text>
        <Text style={styles.sortButtonArrow}>▼</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.sortDropdown}>
          {availableSortOptions.map((option) => {
            const optionIcon = getSortIcon(option)
            const optionLabel = getSortLabel(option)
            const isSelected = option === currentSort

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  isSelected && styles.sortOptionSelected
                ]}
                onPress={() => {
                  onSortChange(option)
                  setIsOpen(false)
                }}
              >
                {isSelected && <Text style={styles.checkmark}>✓ </Text>}
                <Text style={styles.sortOptionText}>
                  {optionIcon} {optionLabel}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

// Helper Functions
function getSortIcon(sort: SearchSortOrder): string {
  const icons: Record<SearchSortOrder, string> = {
    DISTANCE: '📍',
    ALPHABETICAL: '🔤',
    ALPHABETICAL_DESC: '🔤',
    PRIORITY: '⭐',
    NEWEST: '🆕',
    OLDEST: '📅',
    POINTS_ASC: '💰',
    POINTS_DESC: '💰',
    EXPIRING_SOON: '⏰',
    POPULARITY: '📊',
  }
  return icons[sort] || '📊'
}

function getSortLabel(sort: SearchSortOrder): string {
  const labels: Record<SearchSortOrder, string> = {
    DISTANCE: 'Distance',
    ALPHABETICAL: 'A-Z',
    ALPHABETICAL_DESC: 'Z-A',
    PRIORITY: 'Priority',
    NEWEST: 'Newest',
    OLDEST: 'Oldest',
    POINTS_ASC: 'Points: Low-High',
    POINTS_DESC: 'Points: High-Low',
    EXPIRING_SOON: 'Expiring Soon',
    POPULARITY: 'Popularity',
  }
  return labels[sort] || sort
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sortContainer: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sortButtonArrow: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  sortDropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 300,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  checkmark: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  filtersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  filtersBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filtersBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  chipsContainer: {
    marginTop: 8,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#B3D9F2',
  },
  chipText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '500',
  },
  chipRemove: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRemoveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 18,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
})
```

### useActiveFilters.ts (Hook)

```typescript
import { useMemo } from 'react'
import { UnifiedSearchInput } from '../types/graphql'

interface ActiveFilter {
  id: string
  type: string
  label: string
  icon: string
  value: any
}

export function useActiveFilters(filters: UnifiedSearchInput): {
  activeFilters: ActiveFilter[]
  activeFiltersCount: number
} {
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = []

    // Display Types
    if (filters.coupon?.displayTypes && filters.coupon.displayTypes.length > 0) {
      filters.coupon.displayTypes.forEach((type) => {
        const icons: Record<string, string> = {
          HOT: '🔥',
          PROMOTED: '⭐',
          STANDARD: '📋',
        }
        filters.push({
          id: `displayType-${type}`,
          type: 'displayType',
          label: type,
          icon: icons[type] || '📋',
          value: type,
        })
      })
    }

    // Categories
    if (filters.category?.categoryIds && filters.category.categoryIds.length > 0) {
      // Tutaj powinieneś mieć mapowanie ID -> nazwa kategorii
      // Możesz to pobrać z metadata.availableCategories
      filters.category.categoryIds.forEach((id) => {
        filters.push({
          id: `category-${id}`,
          type: 'category',
          label: 'Category', // Zamień na prawdziwą nazwę
          icon: '🏷️',
          value: id,
        })
      })
    }

    // Points - Free
    if (filters.points?.onlyFree) {
      filters.push({
        id: 'points-free',
        type: 'points',
        label: 'Free',
        icon: '💰',
        value: true,
      })
    }

    // Points - Range
    if (filters.points?.minPoints || filters.points?.maxPoints) {
      const min = filters.points.minPoints
      const max = filters.points.maxPoints
      let label = ''
      if (min && max) label = `${min}-${max} pts`
      else if (min) label = `Min ${min} pts`
      else if (max) label = `Max ${max} pts`

      filters.push({
        id: 'points-range',
        type: 'points',
        label,
        icon: '💰',
        value: { min, max },
      })
    }

    // Distance
    if (filters.location?.radiusKm) {
      filters.push({
        id: 'distance-radius',
        type: 'distance',
        label: `Within ${filters.location.radiusKm}km`,
        icon: '📍',
        value: filters.location.radiusKm,
      })
    }

    // City
    if (filters.search?.city) {
      filters.push({
        id: 'city',
        type: 'city',
        label: filters.search.city,
        icon: '🏙️',
        value: filters.search.city,
      })
    }

    // Search Text
    if (filters.search?.searchText) {
      filters.push({
        id: 'search',
        type: 'search',
        label: `"${filters.search.searchText}"`,
        icon: '🔍',
        value: filters.search.searchText,
      })
    }

    // Expiring Soon
    if (filters.date?.expiringInDays) {
      filters.push({
        id: 'expiring',
        type: 'date',
        label: `Expiring in ${filters.date.expiringInDays} days`,
        icon: '⏰',
        value: filters.date.expiringInDays,
      })
    }

    // Discount Types
    if (filters.coupon?.discountTypes && filters.coupon.discountTypes.length > 0) {
      filters.coupon.discountTypes.forEach((type) => {
        const labels: Record<string, string> = {
          PERCENT: 'Percentage',
          AMOUNT: 'Amount',
          FREE: 'Free Item',
        }
        const icons: Record<string, string> = {
          PERCENT: '%',
          AMOUNT: '💵',
          FREE: '🎁',
        }
        filters.push({
          id: `discountType-${type}`,
          type: 'discountType',
          label: labels[type] || type,
          icon: icons[type] || '💵',
          value: type,
        })
      })
    }

    // Affordability
    if (filters.coupon?.onlyAffordable) {
      filters.push({
        id: 'affordable',
        type: 'affordability',
        label: 'Can afford',
        icon: '✅',
        value: true,
      })
    }

    return filters
  }, [filters])

  return {
    activeFilters,
    activeFiltersCount: activeFilters.length,
  }
}
```

### Użycie w głównym ekranie

```typescript
import React from 'react'
import { View, FlatList } from 'react-native'
import { ActiveFiltersBar } from './components/ActiveFiltersBar'
import { useActiveFilters } from './hooks/useActiveFilters'
import { useUnifiedSearch } from './hooks/useUnifiedSearch'

export const CouponsScreen = () => {
  const { filters, updateFilters, data, loading } = useUnifiedSearch()
  const { activeFilters, activeFiltersCount } = useActiveFilters(filters)

  const handleRemoveFilter = (filterId: string) => {
    // Logika usuwania konkretnego filtra
    const [type, value] = filterId.split('-')
    
    const newFilters = { ...filters }
    
    switch (type) {
      case 'displayType':
        newFilters.coupon = {
          ...newFilters.coupon,
          displayTypes: newFilters.coupon?.displayTypes?.filter(t => t !== value)
        }
        break
      case 'category':
        newFilters.category = {
          ...newFilters.category,
          categoryIds: newFilters.category?.categoryIds?.filter(id => id !== value)
        }
        break
      case 'points':
        if (value === 'free') {
          newFilters.points = { ...newFilters.points, onlyFree: undefined }
        } else {
          newFilters.points = { ...newFilters.points, minPoints: undefined, maxPoints: undefined }
        }
        break
      // ... inne przypadki
    }
    
    updateFilters(newFilters)
  }

  const handleClearAll = () => {
    updateFilters({
      sort: filters.sort, // Zachowaj sortowanie
      pagination: filters.pagination, // Zachowaj paginację
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <ActiveFiltersBar
        currentSort={filters.sort?.sortBy || 'DISTANCE'}
        availableSortOptions={data?.metadata?.availableSortOptions || []}
        activeFilters={activeFilters}
        activeFiltersCount={activeFiltersCount}
        onSortChange={(sort) => updateFilters({ ...filters, sort: { sortBy: sort } })}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        onOpenFilters={() => {/* Otwórz modal z filtrami */}}
      />
      
      <FlatList
        data={data?.coupons || []}
        renderItem={({ item }) => <CouponCard item={item} />}
        // ...
      />
    </View>
  )
}
```

## Animacje

### Pojawienie się chipów
- Fade in + slide from left (200ms)
- Stagger animation (każdy chip z 50ms opóźnieniem)

### Usuwanie chipa
- Scale down + fade out (150ms)
- Pozostałe chipy przesuwają się płynnie

### Dropdown sortowania
- Slide down + fade in (200ms)
- Backdrop z fade in (150ms)

## Accessibility

- Wszystkie przyciski mają `accessibilityLabel`
- Chipy mają `accessibilityHint`: "Double tap to remove filter"
- Screen reader ogłasza liczbę aktywnych filtrów
- Dropdown ma `accessibilityRole="menu"`

## Responsywność

- Na małych ekranach chipy scrollują horyzontalnie
- Na tabletach wszystkie chipy widoczne w jednej linii
- Dropdown dostosowuje szerokość do zawartości

## Edge Cases

1. **Brak miejsca na chipy** - horizontal scroll
2. **Bardzo długa nazwa kategorii** - truncate z ellipsis
3. **Wiele filtrów (10+)** - "Show all filters" button po 5 chipach
4. **Brak lokalizacji użytkownika** - sortowanie pokazuje "Default location"
