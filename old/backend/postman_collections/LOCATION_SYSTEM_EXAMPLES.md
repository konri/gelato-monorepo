# Location System - Postman Curl Examples

## 1. Search with GPS Coordinates

# Search Stores and Coupons - GPS Location

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query SearchByLocation($location: LocationSearchInput!) { searchByLocation(location: $location) { stores { store { id name address city } merchant { name } distanceKm } coupons { coupon { id title discountValue } merchant { name } store { name } distanceKm } searchLatitude searchLongitude searchRadiusKm } }",
"variables": {
"location": {
"latitude": 50.0647,
"longitude": 19.945,
"radiusKm": 10
}
}
}'

## 2. Search with Fallback (User's Preferred City)

# Search with Fallback - Uses preferredCity from User

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query SearchByFallback($radiusKm: Float, $searchText: String) { searchByFallbackLocation(radiusKm: $radiusKm, searchText: $searchText) { stores { store { id name address city } merchant { name } distanceKm } coupons { coupon { id title discountValue } merchant { name } store { name } distanceKm } searchLatitude searchLongitude searchRadiusKm } }",
"variables": {
"radiusKm": 25,
"searchText": null
}
}'

## 3. Nearby Stamp Card Stores (Automatic Location)

# Get Nearby Stamp Card Stores (CLIENT) - auto location

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query NearbyStampCardStores { nearbyStampCardStores { store { id name address city latitude longitude } merchant { id name logoUrl } distanceKm stampIconUrl stampCardProgress { hasCard stampsCollected stampsRequired cardId } } }"
}'

## 4. Nearby Stamp Card Stores with GPS

# Get Nearby Stamp Card Stores - GPS Location (CLIENT)

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query NearbyStampCardStoresGPS($location: LocationSearchInput) { nearbyStampCardStores(location: $location) { store { id name address city } merchant { name } distanceKm stampIconUrl stampCardProgress { hasCard stampsCollected stampsRequired } } }",
"variables": {
"location": {
"latitude": 50.0647,
"longitude": 19.945,
"radiusKm": 15
}
}
}'

## 5. Update User Preferred City

# Update User Preferred City (ANY ROLE) - requires userId

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "mutation UpdateUserCity($id: Int!, $preferredCity: String) { updateUser(id: $id, preferredCity: $preferredCity) { id email preferredCity } }",
"variables": {
"id": 1,
"preferredCity": "Kraków"
}
}'

## 6. Search with Text Filter

# Search Stores by Name - Fallback Location

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query SearchByText($searchText: String, $radiusKm: Float) { searchByFallbackLocation(searchText: $searchText, radiusKm: $radiusKm) { stores { store { id name address city } merchant { name } distanceKm } searchLatitude searchLongitude } }",
"variables": {
"searchText": "Starbucks",
"radiusKm": 50
}
}'

## 7. Nearby Stores Only

# Get Nearby Stores - GPS Location

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query NearbyStores($location: LocationSearchInput!) { nearbyStores(location: $location) { store { id name address city phone hours } merchant { name logoUrl } distanceKm } }",
"variables": {
"location": {
"latitude": 50.0647,
"longitude": 19.945,
"radiusKm": 5
}
}
}'

## 8. Nearby Coupons Only

# Get Nearby Coupons - GPS Location

curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
"query": "query NearbyCoupons($location: LocationSearchInput!) { nearbyCoupons(location: $location) { coupon { id title description discountType discountValue validUntil } merchant { name logoUrl } store { name address city } distanceKm } }",
"variables": {
"location": {
"latitude": 50.0647,
"longitude": 19.945,
"radiusKm": 10
}
}
}'

## Test Scenarios

### Scenario 1: User with GPS enabled

1. User grants location permission
2. App gets GPS coordinates (50.0647, 19.945)
3. Call `searchByLocation` with GPS coordinates
4. Result: Stores within 10km radius

### Scenario 2: User without GPS, with preferredCity

1. User denies location permission
2. User has `preferredCity: "Kraków"` in database
3. Call `searchByFallbackLocation` without parameters
4. System fetches Kraków coordinates from Nominatim API
5. Result: Stores within 25km radius of Kraków

### Scenario 3: User without GPS, without preferredCity

1. User denies location permission
2. User has no `preferredCity` set
3. Call `searchByFallbackLocation` without parameters
4. System uses default location (Kraków)
5. Result: Stores within 25km radius of Kraków

### Scenario 4: Update user city

1. User selects city from picker: "Wrocław"
2. Call `updateUser` mutation with `preferredCity: "Wrocław"`
3. Next time user calls `searchByFallbackLocation`
4. System uses Wrocław coordinates from Nominatim API

## Expected Responses

### Success Response (with stores)

```json
{
  "data": {
    "searchByFallbackLocation": {
      "stores": [
        {
          "store": {
            "id": "store-123",
            "name": "Starbucks Galeria Krakowska",
            "address": "ul. Pawia 5",
            "city": "Kraków"
          },
          "merchant": {
            "name": "Starbucks"
          },
          "distanceKm": 2.5
        }
      ],
      "coupons": [],
      "searchLatitude": 50.0647,
      "searchLongitude": 19.945,
      "searchRadiusKm": 25
    }
  }
}
```

### Success Response (no results)

```json
{
  "data": {
    "searchByFallbackLocation": {
      "stores": [],
      "coupons": [],
      "searchLatitude": 50.0647,
      "searchLongitude": 19.945,
      "searchRadiusKm": 25
    }
  }
}
```

## Notes

- All location queries work without authentication (PUBLIC)
- `nearbyStampCardStores` requires authentication (CLIENT role)
- `updateUser` requires authentication (ANY ROLE)
- Default radius: 10km for GPS, 25km for fallback
- Default location: Kraków (50.0647, 19.945)
- Nominatim API is free but rate-limited (1 req/sec)
