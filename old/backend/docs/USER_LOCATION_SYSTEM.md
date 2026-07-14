# User Location System - Generic Location Resolution

## Overview

System generycznego rozwiązywania lokalizacji użytkownika z priorytetami fallback i integracją z OpenStreetMap Nominatim API.

## Priority Flow

```
1. GPS Coordinates (user provides lat/lng)
   ↓ (if not provided)
2. User's Preferred City (from database: User.preferredCity)
   ↓ (if not set)
3. Default Location (Kraków, Poland)
```

## Key Features

### 1. Generic Location Resolution

Metoda `resolveUserLocation()` w `LocationService`:

```typescript
async resolveUserLocation(): Promise<{ latitude: number; longitude: number }> {
  // 1. Try user's preferred city from database
  const preferredCity = await this.getUserPreferredCity()
  if (preferredCity) {
    const coords = await this.getCityCoordinates(preferredCity)
    if (coords) return coords
  }

  // 2. Fallback to default (Kraków)
  return { latitude: 50.0647, longitude: 19.945 }
}
```

### 2. OpenStreetMap Nominatim Integration

Darmowe API do geocodingu miast:

```typescript
async getCityCoordinates(cityName: string): Promise<{ latitude: number; longitude: number } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=Poland&format=json&limit=1`,
    {
      headers: { 'User-Agent': 'EasyBons/1.0' },
    }
  )
  // Returns coordinates for any Polish city
}
```

### 3. Database Integration

Pole `preferredCity` w modelu `User`:

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  preferredCity   String?  // "Kraków", "Warszawa", "Wrocław", etc.
  // ... other fields
}
```

## Usage Examples

### Example 1: User with GPS (highest priority)

```graphql
query {
  searchByLocation(location: { latitude: 50.0647, longitude: 19.945, radiusKm: 10 }) {
    stores {
      store {
        name
      }
      distanceKm
    }
  }
}
```

### Example 2: User without GPS, with preferredCity

User has `preferredCity: "Kraków"` in database:

```graphql
query {
  searchByFallbackLocation(radiusKm: 25) {
    stores {
      store {
        name
      }
      distanceKm
    }
    searchLatitude # 50.0647 (Kraków coordinates from Nominatim)
    searchLongitude # 19.945
  }
}
```

### Example 3: User without GPS, without preferredCity

```graphql
query {
  searchByFallbackLocation(radiusKm: 25) {
    stores {
      store {
        name
      }
      distanceKm
    }
    searchLatitude # 50.0647 (default: Kraków)
    searchLongitude # 19.945
  }
}
```

### Example 4: Stamp Card Stores (automatic fallback)

```graphql
query {
  nearbyStampCardStores {
    # No location parameter needed!
    # System automatically uses: GPS > preferredCity > default
    store {
      name
    }
    distanceKm
    stampCardProgress {
      hasCard
      stampsCollected
    }
  }
}
```

## Endpoints Using Generic Location

All these endpoints now support automatic location resolution:

1. **`searchByFallbackLocation`** - main search with fallback
2. **`nearbyStampCardStores`** - stamp card stores (optional GPS)
3. **`nearbyCoupons`** - coupons (when extended)
4. **`nearbyStores`** - stores (when extended)

## Setting User's Preferred City

### GraphQL Mutation

```graphql
mutation {
  updateUser(id: "user-id", preferredCity: "Kraków") {
    id
    preferredCity
  }
}
```

### Mobile App Flow

```typescript
// 1. Ask user for location permission
const hasPermission = await requestLocationPermission()

if (!hasPermission) {
  // 2. Show city picker
  const city = await showCityPicker(['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk'])

  // 3. Save to database
  await updateUser({ preferredCity: city })
}
```

## Supported Cities

System obsługuje **dowolne polskie miasto** dzięki Nominatim API:

- Warszawa
- Kraków
- Wrocław
- Poznań
- Gdańsk
- Katowice
- Łódź
- ... i wszystkie inne polskie miasta

## Default Location

**Kraków, Poland**:

- Latitude: `50.0647`
- Longitude: `19.945`

## Benefits

1. **Generic** - jedna metoda dla wszystkich endpointów
2. **Flexible** - obsługa dowolnych polskich miast
3. **Free** - darmowe API (Nominatim)
4. **Fallback** - zawsze zwraca lokalizację (Kraków jako default)
5. **User-Friendly** - nie wymaga GPS jeśli user ma ustawione miasto
6. **Reusable** - łatwo dodać do nowych endpointów

## Integration with Other Endpoints

Aby dodać generic location do nowego endpointu:

```typescript
@Query(() => [YourType])
async yourEndpoint(
  @Arg('location', { nullable: true }) location: LocationSearchInput,
  @Ctx() ctx: Context
) {
  const userId = ctx.req.user?.id
  this.locationService = new LocationService(ctx.prisma, userId)

  let coords: { latitude: number; longitude: number }

  if (location?.latitude && location?.longitude) {
    // Use provided GPS
    coords = { latitude: location.latitude, longitude: location.longitude }
  } else {
    // Use generic resolution (preferredCity > default)
    coords = await this.locationService.resolveUserLocation()
  }

  // Use coords for your logic
  return await this.locationService.findNearby(coords.latitude, coords.longitude)
}
```

## Nominatim API Limits

- **Free tier**: 1 request/second
- **No API key required**
- **User-Agent header required**: `EasyBons/1.0`
- **Fair use policy**: cache results when possible

## Future Improvements

1. **Cache city coordinates** - reduce API calls
2. **Support international cities** - remove `country=Poland` filter
3. **User location history** - track frequently used locations
4. **Smart radius** - adjust radius based on city size
5. **Nearby cities** - search in neighboring cities if no results
