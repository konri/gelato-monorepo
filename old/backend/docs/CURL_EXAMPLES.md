# Przykłady cURL - System Filtrowania i Sortowania

## Konfiguracja

W Postmanie używasz zmiennych środowiskowych `{{base_url}}`. W cURL możesz to zasymulować na dwa sposoby:

### Sposób 1: Zamień ręcznie przed uruchomieniem

```bash
# Zamień {{base_url}} na rzeczywisty URL:
# Development: http://localhost:4000
# Staging: https://staging-api.easybons.com
# Production: https://api.easybons.com
```

### Sposób 2: Użyj zmiennej bash

```bash
# Ustaw zmienną
base_url="http://localhost:4000"

# Użyj w komendach (zamień {{base_url}} na $base_url)
```

## 1. Podstawowe Wyszukiwanie z Lokalizacją

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 } }) { stores { store { id name address city } distanceKm } metadata { totalResults filteredResults } } }"
  }'
```

## 2. Wyszukiwanie z Sortowaniem Alfabetycznym

**UWAGA:** W GraphQL enumy nie używają cudzysłowów!

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 }, sort: { sortBy: ALPHABETICAL } }) { stores { store { id name } distanceKm } } }"
  }'
```

## 3. Filtrowanie po Kategorii (ID)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, category: { categoryIds: [\"cat-123\", \"cat-456\"] } }) { stores { store { name } merchant { category { name } } } } }"
  }'
```

## 3b. Filtrowanie po Kategorii (Slug)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, category: { categorySlugs: [\"food\", \"beauty\"] } }) { stores { store { name } merchant { category { name } } } } }"
  }'
```

## 3c. Filtrowanie po Kategorii (Nazwa - częściowe dopasowanie)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, category: { categoryNames: [\"Jedzenie\", \"Uroda\"] } }) { stores { store { name } merchant { category { name } } } } }"
  }'
```

## 4. Tylko Darmowe Kupony

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, points: { onlyFree: true } }) { coupons { coupon { id title pointsCost } distanceKm } } }"
  }'
```

## 5. Filtrowanie po Zakresie Punktów

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, points: { minPoints: 0, maxPoints: 500 } }) { coupons { coupon { title pointsCost } } } }"
  }'
```

## 6. Sortowanie po Punktach (Rosnąco)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, sort: { sortBy: POINTS_ASC } }) { coupons { coupon { title pointsCost } distanceKm } } }"
  }'
```

## 7. Wyszukiwanie Tekstowe + Miasto

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, search: { searchText: \"pizza\", city: \"Kraków\" } }) { stores { store { name city } } } }"
  }'
```

## 8. Paginacja

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, pagination: { page: 1, pageSize: 20 } }) { stores { store { name } } metadata { totalResults filteredResults } } }"
  }'
```

## 9. Kompletne Zapytanie z Wszystkimi Filtrami

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query CompleteSearch { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945, radiusKm: 15 }, category: { categoryNames: [\"Jedzenie\"] }, points: { maxPoints: 500 }, search: { city: \"Kraków\", searchText: \"pizza\" }, sort: { sortBy: DISTANCE }, pagination: { page: 1, pageSize: 20 } }) { stores { store { id name address city } merchant { name logoUrl category { name } } distanceKm } coupons { coupon { id title pointsCost discountType validUntil } merchant { name } distanceKm } stampCardStores { store { name } stampCardProgress { hasCard stampsCollected stampsRequired } distanceKm } metadata { availableCategories { id name count } availableCities { name count } pointsRange { min max freeCount } appliedFilters { sortBy categoryIds radiusKm } totalResults filteredResults hasUserLocation } } }"
  }'
```

## 10. Pobierz Opcje Filtrowania dla Kuponów

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getCouponFilterOptions { availableCategories { id name count } availableCities { name count } pointsRange { min max freeCount } availableSortOptions availableDisplayTypes availableDiscountTypes } }"
  }'
```

## 11. Pobierz Opcje Filtrowania dla Sklepów

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getStoreFilterOptions { availableCategories { id name count } availableCities { name count } availableSortOptions } }"
  }'
```

## 12. Pobierz Opcje Filtrowania dla Kart Stempli

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getStampCardFilterOptions { availableCategories { id name count } availableCities { name count } availableSortOptions } }"
  }'
```

## 13. Tylko Dostępne dla Użytkownika (wymaga autoryzacji)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, coupon: { onlyAffordable: true } }) { coupons { coupon { title pointsCost } } } }"
  }'
```

## 14. Karty Stempli Blisko Nagrody (wymaga autoryzacji)

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, stampCard: { closeToReward: true } }) { stampCardStores { store { name } stampCardProgress { stampsCollected stampsRequired } distanceKm } } }"
  }'
```

## 15. Kupony Wygasające Wkrótce

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, date: { expiringInDays: 7 }, sort: { sortBy: EXPIRING_SOON } }) { coupons { coupon { title validUntil } distanceKm } } }"
  }'
```

## 16. Sortowanie po Popularności

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, sort: { sortBy: POPULARITY } }) { coupons { coupon { title } distanceKm } } }"
  }'
```

## 17. Sortowanie po Priorytecie

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, sort: { sortBy: PRIORITY } }) { coupons { coupon { title displayType } distanceKm } } }"
  }'
```

## 18. Odwrócone Sortowanie

```bash
curl -X POST {{base_url}}/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { unifiedSearch(filters: { location: { latitude: 50.0647, longitude: 19.945 }, sort: { sortBy: DISTANCE, reverse: true } }) { stores { store { name } distanceKm } } }"
  }'
```

---

## Ważne Uwagi

### Enumy w GraphQL

**Enumy NIE używają cudzysłowów!**

✅ Poprawnie:

```graphql
sort: { sortBy: ALPHABETICAL }
```

❌ Błędnie:

```graphql
sort: { sortBy: "ALPHABETICAL" }
```

### Dostępne Opcje Sortowania

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

### Filtrowanie po Kategorii - 3 Sposoby

1. **Po ID** (dokładne dopasowanie):

```graphql
category: { categoryIds: ["cat-123"] }
```

2. **Po slug** (dokładne dopasowanie):

```graphql
category: { categorySlugs: ["food", "beauty"] }
```

3. **Po nazwie** (częściowe dopasowanie, case-insensitive):

```graphql
category: { categoryNames: ["Jedzenie", "Uroda"] }
```

---

## Jak Używać z Postmanem

Możesz skopiować te przykłady bezpośrednio do Postmana:

1. Skopiuj całą komendę cURL
2. W Postmanie: `Import` → `Raw text` → Wklej
3. Postman automatycznie zamieni `{{base_url}}` na zmienną środowiskową

## Jak Używać w Terminalu

Przed uruchomieniem zamień `{{base_url}}` na rzeczywisty URL:

```bash
# Development
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'

# Production
curl -X POST https://api.easybons.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'
```

Lub użyj zmiennej bash:

```bash
base_url="http://localhost:4000"

curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'
```
