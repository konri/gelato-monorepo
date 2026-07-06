# cURL Examples - Favorite Stores

Wszystkie operacje wymagają tokenu JWT użytkownika z rolą `CLIENT`.

## Konfiguracja

```bash
base_url="http://localhost:4000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # JWT token zalogowanego usera
```

---

## Flow

```
1. User widzi listę storów (np. z searchByLocation)
2. Klika "dodaj do ulubionych" → addFavoriteStore
3. Może przeglądać swoje ulubione → myFavoriteStores
4. Może usunąć ze ulubionych → removeFavoriteStore
```

---

## 1. Pobierz ulubione story usera

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { myFavoriteStores { id merchantStoreId createdAt merchantStore { id name address city phone logoUrl merchant { id name logoUrl } } } }"
  }'
```

**Odpowiedź (200):**

```json
{
  "data": {
    "myFavoriteStores": [
      {
        "id": "fav-uuid-1",
        "merchantStoreId": "store-uuid-1",
        "createdAt": "2026-03-19T10:00:00.000Z",
        "merchantStore": {
          "id": "store-uuid-1",
          "name": "Pizza Roma - Centrum",
          "address": "ul. Floriańska 12",
          "city": "Kraków",
          "phone": "+48123456789",
          "logoUrl": "https://cdn.easybons.com/logos/pizza-roma.png",
          "merchant": {
            "id": "merchant-uuid-1",
            "name": "Pizza Roma",
            "logoUrl": "https://cdn.easybons.com/logos/pizza-roma.png"
          }
        }
      }
    ]
  }
}
```

---

## 2. Dodaj store do ulubionych

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { addFavoriteStore(merchantStoreId: \"store-uuid-1\") { id merchantStoreId createdAt merchantStore { id name city merchant { name } } } }"
  }'
```

**Odpowiedź (200):**

```json
{
  "data": {
    "addFavoriteStore": {
      "id": "fav-uuid-1",
      "merchantStoreId": "store-uuid-1",
      "createdAt": "2026-03-19T10:00:00.000Z",
      "merchantStore": {
        "id": "store-uuid-1",
        "name": "Pizza Roma - Centrum",
        "city": "Kraków",
        "merchant": {
          "name": "Pizza Roma"
        }
      }
    }
  }
}
```

**Błąd - store już w ulubionych:**

```json
{
  "errors": [{ "message": "Store already in favorites" }]
}
```

**Błąd - store nie istnieje:**

```json
{
  "errors": [{ "message": "Store not found" }]
}
```

---

## 3. Usuń store z ulubionych

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { removeFavoriteStore(merchantStoreId: \"store-uuid-1\") }"
  }'
```

**Odpowiedź (200):**

```json
{
  "data": {
    "removeFavoriteStore": true
  }
}
```

**Błąd - store nie był w ulubionych:**

```json
{
  "errors": [{ "message": "Store not in favorites" }]
}
```

---

## Błędy autoryzacji

Brak tokenu lub nieprawidłowy token:

```json
{
  "errors": [{ "message": "Access denied! You need to be authorized to perform this action!" }]
}
```
