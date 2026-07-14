# Frontend GraphQL Request Format - Rozwiązanie Błędu 400

## Problem

Frontend otrzymuje błąd 400 przy wywołaniu `unifiedSearch`:

```
Response not successful: Received status code 400
```

## Przyczyna

Frontend wysyła **niepoprawny format** - tylko obiekt filtrów bez GraphQL query:

```javascript
// ❌ BŁĄD - to NIE jest poprawny GraphQL request
{
  "coupon": {"displayTypes": ["HOT"]},
  "sort": {"sortBy": "DISTANCE"},
  "pagination": {"pageSize": 100}
}
```

## Rozwiązanie

GraphQL wymaga **zawsze** pola `query` (i opcjonalnie `variables`):

```javascript
// ✅ POPRAWNIE
{
  "query": "query UnifiedSearch($filters: UnifiedSearchInput!) { unifiedSearch(filters: $filters) { coupons { coupon { id title } } } }",
  "variables": {
    "filters": {
      "coupon": {"displayTypes": ["HOT"]},
      "sort": {"sortBy": "DISTANCE"},
      "pagination": {"pageSize": 100}
    }
  }
}
```

## Przykłady dla Różnych Frameworków

### React + Apollo Client

```typescript
import { gql, useQuery } from '@apollo/client'

const UNIFIED_SEARCH = gql`
  query UnifiedSearch($filters: UnifiedSearchInput!) {
    unifiedSearch(filters: $filters) {
      coupons {
        coupon {
          id
          title
          description
          pointsCost
          displayType
          imageUrl
        }
        merchant {
          id
          name
          logoUrl
        }
        store {
          id
          name
          city
        }
        distanceKm
      }
      metadata {
        totalResults
        filteredResults
        availableDisplayTypes
      }
    }
  }
`

function HotCoupons() {
  const { data, loading, error } = useQuery(UNIFIED_SEARCH, {
    variables: {
      filters: {
        coupon: {
          displayTypes: ['HOT'],
        },
        sort: {
          sortBy: 'DISTANCE',
        },
        pagination: {
          pageSize: 100,
        },
      },
    },
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data.unifiedSearch.coupons.map((item) => (
        <div key={item.coupon.id}>
          {item.coupon.title} - {item.distanceKm.toFixed(2)} km
        </div>
      ))}
    </div>
  )
}
```

### React Native + Fetch

```typescript
async function fetchHotCoupons(token?: string) {
  const response = await fetch('https://api-dev.easybons.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query: `
        query UnifiedSearch($filters: UnifiedSearchInput!) {
          unifiedSearch(filters: $filters) {
            coupons {
              coupon {
                id
                title
                description
                pointsCost
                displayType
                imageUrl
              }
              merchant {
                id
                name
                logoUrl
              }
              store {
                id
                name
                city
              }
              distanceKm
            }
            metadata {
              totalResults
              filteredResults
            }
          }
        }
      `,
      variables: {
        filters: {
          coupon: {
            displayTypes: ['HOT'],
          },
          sort: {
            sortBy: 'DISTANCE',
          },
          pagination: {
            pageSize: 100,
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data.unifiedSearch
}
```

### Axios

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api-dev.easybons.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

async function getHotCoupons(token?: string) {
  const response = await client.post(
    '/graphql',
    {
      query: `
      query UnifiedSearch($filters: UnifiedSearchInput!) {
        unifiedSearch(filters: $filters) {
          coupons {
            coupon { id title }
            distanceKm
          }
        }
      }
    `,
      variables: {
        filters: {
          coupon: { displayTypes: ['HOT'] },
          sort: { sortBy: 'DISTANCE' },
          pagination: { pageSize: 100 },
        },
      },
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  return response.data.data.unifiedSearch
}
```

## Debugowanie

### Sprawdź co faktycznie wysyła frontend

```typescript
// Dodaj interceptor w axios lub middleware w fetch
console.log('Sending GraphQL request:', JSON.stringify({
  query: '...',
  variables: { ... }
}, null, 2))
```

### Typowe błędy

1. **Brak pola `query`**

   ```javascript
   // ❌ BŁĄD
   fetch('/graphql', {
     body: JSON.stringify({ filters: {...} })
   })
   ```

2. **Zmienne poza obiektem `variables`**

   ```javascript
   // ❌ BŁĄD
   fetch('/graphql', {
     body: JSON.stringify({
       query: '...',
       filters: {...}  // Powinno być w variables!
     })
   })
   ```

3. **Niepoprawny format query string**
   ```javascript
   // ❌ BŁĄD - query musi być stringiem
   fetch('/graphql', {
     body: JSON.stringify({
       query: { unifiedSearch: {...} }  // To nie jest string!
     })
   })
   ```

## Testowanie

Użyj tego curl do weryfikacji, że backend działa:

```bash
curl -X POST https://api-dev.easybons.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query UnifiedSearch($filters: UnifiedSearchInput!) { unifiedSearch(filters: $filters) { coupons { coupon { id title } distanceKm } metadata { totalResults } } }",
    "variables": {
      "filters": {
        "coupon": {"displayTypes": ["HOT"]},
        "sort": {"sortBy": "DISTANCE"},
        "pagination": {"pageSize": 100}
      }
    }
  }'
```

Jeśli curl działa, a frontend nie - problem jest w formacie requesta po stronie frontendu.
